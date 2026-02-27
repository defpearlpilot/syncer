use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::proposal::{CreateProposalInput, Proposal, UpdateProposalInput};
use crate::services::proposal_service;
use crate::AppState;

pub async fn get_proposal(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(proposal_id): Path<Uuid>,
) -> Result<Json<Proposal>, AppError> {
    let proposal = proposal_service::get_proposal(&state.db, proposal_id, auth.user_id).await?;
    Ok(Json(proposal))
}

pub async fn create_proposal(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
    Json(input): Json<CreateProposalInput>,
) -> Result<Json<Proposal>, AppError> {
    let proposal = proposal_service::create_proposal(&state.db, room_id, auth.user_id, input).await?;
    Ok(Json(proposal))
}

pub async fn list_proposals(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
) -> Result<Json<Vec<Proposal>>, AppError> {
    let proposals = proposal_service::list_proposals(&state.db, room_id, auth.user_id).await?;
    Ok(Json(proposals))
}

pub async fn update_proposal(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(proposal_id): Path<Uuid>,
    Json(input): Json<UpdateProposalInput>,
) -> Result<Json<Proposal>, AppError> {
    let proposal = proposal_service::update_proposal(&state.db, proposal_id, auth.user_id, input).await?;
    Ok(Json(proposal))
}

pub async fn delete_proposal(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(proposal_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    proposal_service::delete_proposal(&state.db, proposal_id, auth.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
