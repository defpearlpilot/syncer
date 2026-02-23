use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket};
use axum::extract::{Path, State, WebSocketUpgrade};
use axum::response::Response;
use futures::{SinkExt, StreamExt};
use sqlx::PgPool;
use tokio::sync::mpsc;
use uuid::Uuid;

use super::manager::RoomManager;
use super::messages::{WsClientMessage, WsEnvelope, WsServerMessage};
use super::presence;
use crate::auth::middleware::AuthUser;
use crate::models::comment::CreateCommentInput;
use crate::models::proposal::{CreateProposalInput, UpdateProposalInput};
use crate::models::score::UpsertScoreInput;
use crate::services::{comment_service, proposal_service, room_service, score_service};
use crate::AppState;

pub async fn ws_upgrade(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
    ws: WebSocketUpgrade,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, auth.user_id, room_id))
}

async fn handle_socket(socket: WebSocket, state: AppState, user_id: Uuid, room_id: Uuid) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<WsServerMessage>();

    // Register in room
    state.room_manager.join(room_id, user_id, tx);

    // Get user display name
    let display_name = sqlx::query_scalar::<sqlx::Postgres, String>(
        "SELECT display_name FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or_else(|_| "Unknown".to_string());

    // Broadcast user_joined
    state.room_manager.broadcast_except(
        &room_id,
        &user_id,
        WsServerMessage::UserJoined {
            user_id,
            display_name: display_name.clone(),
        },
    );

    // Send presence_sync to new user
    let presence_list = presence::get_presence_list(&state.db, &state.room_manager, &room_id).await;
    state.room_manager.send_to(
        &room_id,
        &user_id,
        WsServerMessage::PresenceSync {
            users: presence_list,
        },
    );

    // Write task: forward mpsc messages to WS
    let write_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            let text = match serde_json::to_string(&msg) {
                Ok(t) => t,
                Err(_) => continue,
            };
            if ws_sender.send(Message::Text(text.into())).await.is_err() {
                break;
            }
        }
    });

    // Read task: process client messages
    let db = state.db.clone();
    let room_mgr = state.room_manager.clone();
    let read_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = ws_receiver.next().await {
            match msg {
                Message::Text(text) => {
                    handle_client_message(&db, &room_mgr, room_id, user_id, &text).await;
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = write_task => {},
        _ = read_task => {},
    }

    // Cleanup
    state.room_manager.leave(room_id, &user_id);
    state
        .room_manager
        .broadcast(&room_id, WsServerMessage::UserLeft { user_id });
}

async fn handle_client_message(
    db: &PgPool,
    room_manager: &Arc<RoomManager>,
    room_id: Uuid,
    user_id: Uuid,
    text: &str,
) {
    let envelope: WsEnvelope = match serde_json::from_str(text) {
        Ok(e) => e,
        Err(e) => {
            room_manager.send_to(
                &room_id,
                &user_id,
                WsServerMessage::Error {
                    message: format!("Invalid message: {e}"),
                },
            );
            return;
        }
    };

    let request_id = envelope.request_id;

    match envelope.message {
        WsClientMessage::Ping => {
            room_manager.send_to(&room_id, &user_id, WsServerMessage::Pong);
        }

        WsClientMessage::ProposalCreate { title, body } => {
            match proposal_service::create_proposal(
                db,
                room_id,
                user_id,
                CreateProposalInput {
                    title,
                    body,
                },
            )
            .await
            {
                Ok(proposal) => {
                    let payload = serde_json::to_value(&proposal).unwrap_or_default();
                    room_manager.broadcast(&room_id, WsServerMessage::ProposalCreated(payload));
                    send_ack(room_manager, &room_id, &user_id, request_id);
                }
                Err(e) => {
                    room_manager.send_to(
                        &room_id,
                        &user_id,
                        WsServerMessage::Error {
                            message: e.to_string(),
                        },
                    );
                }
            }
        }

        WsClientMessage::ProposalUpdate {
            proposal_id,
            title,
            body,
        } => {
            match proposal_service::update_proposal(
                db,
                proposal_id,
                user_id,
                UpdateProposalInput { title, body },
            )
            .await
            {
                Ok(proposal) => {
                    let payload = serde_json::to_value(&proposal).unwrap_or_default();
                    room_manager.broadcast(&room_id, WsServerMessage::ProposalUpdated(payload));
                    send_ack(room_manager, &room_id, &user_id, request_id);
                }
                Err(e) => {
                    room_manager.send_to(
                        &room_id,
                        &user_id,
                        WsServerMessage::Error {
                            message: e.to_string(),
                        },
                    );
                }
            }
        }

        WsClientMessage::CommentCreate {
            body,
            proposal_id,
            parent_id,
        } => {
            match comment_service::create_comment(
                db,
                room_id,
                user_id,
                CreateCommentInput {
                    body,
                    proposal_id,
                    parent_id,
                },
            )
            .await
            {
                Ok(comment) => {
                    let payload = serde_json::to_value(&comment).unwrap_or_default();
                    room_manager.broadcast(&room_id, WsServerMessage::CommentCreated(payload));
                    send_ack(room_manager, &room_id, &user_id, request_id);
                }
                Err(e) => {
                    room_manager.send_to(
                        &room_id,
                        &user_id,
                        WsServerMessage::Error {
                            message: e.to_string(),
                        },
                    );
                }
            }
        }

        WsClientMessage::ScoreUpsert {
            proposal_id,
            dimension_id,
            value,
        } => {
            match score_service::upsert_score(
                db,
                proposal_id,
                user_id,
                UpsertScoreInput {
                    dimension_id,
                    value,
                },
            )
            .await
            {
                Ok(score) => {
                    let payload = serde_json::to_value(&score).unwrap_or_default();
                    room_manager.broadcast(&room_id, WsServerMessage::ScoreUpdated(payload));
                    send_ack(room_manager, &room_id, &user_id, request_id);
                }
                Err(e) => {
                    room_manager.send_to(
                        &room_id,
                        &user_id,
                        WsServerMessage::Error {
                            message: e.to_string(),
                        },
                    );
                }
            }
        }

        WsClientMessage::RoomTransition => {
            match room_service::transition_stage(db, room_id, user_id).await {
                Ok(room) => {
                    let payload = serde_json::to_value(&room).unwrap_or_default();
                    room_manager.broadcast(&room_id, WsServerMessage::StageChanged(payload));
                    send_ack(room_manager, &room_id, &user_id, request_id);
                }
                Err(e) => {
                    room_manager.send_to(
                        &room_id,
                        &user_id,
                        WsServerMessage::Error {
                            message: e.to_string(),
                        },
                    );
                }
            }
        }
    }
}

fn send_ack(room_manager: &Arc<RoomManager>, room_id: &Uuid, user_id: &Uuid, request_id: Option<String>) {
    if let Some(rid) = request_id {
        room_manager.send_to(room_id, user_id, WsServerMessage::Ack { request_id: rid });
    }
}
