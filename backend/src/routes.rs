use axum::routing::{get, patch, post, put};
use axum::Router;

use crate::auth::handlers as auth_handlers;
use crate::handlers::{comments, dimensions, proposals, rooms, scores, workspaces};
use crate::ws::handler as ws_handler;
use crate::AppState;

pub fn build_router(state: AppState) -> Router {
    let auth_routes = Router::new()
        .route("/register", post(auth_handlers::register))
        .route("/login", post(auth_handlers::login))
        .route("/logout", post(auth_handlers::logout))
        .route("/me", get(auth_handlers::me));

    let workspace_routes = Router::new()
        .route("/", post(workspaces::create_workspace).get(workspaces::list_workspaces))
        .route("/{id}", get(workspaces::get_workspace))
        .route("/{id}/invite", post(workspaces::invite_member))
        .route("/{wid}/rooms", post(rooms::create_room).get(rooms::list_rooms));

    let room_routes = Router::new()
        .route("/{id}", get(rooms::get_room).patch(rooms::update_room))
        .route("/{id}/transition", post(rooms::transition_stage))
        .route("/{id}/decide", post(rooms::decide))
        .route("/{id}/stages", get(rooms::get_stages).put(rooms::replace_stages))
        .route("/{id}/dimensions", post(dimensions::create_dimension).get(dimensions::list_dimensions))
        .route("/{rid}/proposals", post(proposals::create_proposal).get(proposals::list_proposals))
        .route("/{rid}/comments", post(comments::create_comment).get(comments::list_comments))
        .route("/{rid}/scores/summary", get(scores::get_score_summary));

    let proposal_routes = Router::new()
        .route("/{id}", patch(proposals::update_proposal).delete(proposals::delete_proposal))
        .route("/{pid}/scores", put(scores::upsert_score));

    let comment_routes = Router::new()
        .route("/{id}", patch(comments::update_comment).delete(comments::delete_comment));

    let dimension_routes = Router::new()
        .route("/{id}", patch(dimensions::update_dimension).delete(dimensions::delete_dimension));

    Router::new()
        .nest("/api/auth", auth_routes)
        .nest("/api/workspaces", workspace_routes)
        .nest("/api/rooms", room_routes)
        .nest("/api/proposals", proposal_routes)
        .nest("/api/comments", comment_routes)
        .nest("/api/dimensions", dimension_routes)
        .route("/api/ws/{room_id}", get(ws_handler::ws_upgrade))
        .with_state(state)
}
