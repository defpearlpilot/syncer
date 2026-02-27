use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::comment::{Comment, CommentWithAuthor, CreateCommentInput, UpdateCommentInput};
use crate::services::comment_service;
use crate::AppState;

pub async fn create_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
    Json(input): Json<CreateCommentInput>,
) -> Result<Json<Comment>, AppError> {
    let comment = comment_service::create_comment(&state.db, room_id, auth.user_id, input).await?;
    Ok(Json(comment))
}

pub async fn list_comments(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
) -> Result<Json<Vec<CommentWithAuthor>>, AppError> {
    let comments = comment_service::list_comments(&state.db, room_id, auth.user_id).await?;
    Ok(Json(comments))
}

pub async fn list_proposal_comments(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(proposal_id): Path<Uuid>,
) -> Result<Json<Vec<CommentWithAuthor>>, AppError> {
    let comments = comment_service::list_proposal_comments(&state.db, proposal_id, auth.user_id).await?;
    Ok(Json(comments))
}

pub async fn update_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(comment_id): Path<Uuid>,
    Json(input): Json<UpdateCommentInput>,
) -> Result<Json<Comment>, AppError> {
    let comment = comment_service::update_comment(&state.db, comment_id, auth.user_id, input).await?;
    Ok(Json(comment))
}

pub async fn delete_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(comment_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    comment_service::delete_comment(&state.db, comment_id, auth.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
