use axum::extract::{Path, State};
use axum::Json;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::score::{Score, ScoreSummary, UpsertScoreInput};
use crate::services::score_service;
use crate::AppState;

pub async fn upsert_score(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(proposal_id): Path<Uuid>,
    Json(input): Json<UpsertScoreInput>,
) -> Result<Json<Score>, AppError> {
    let score = score_service::upsert_score(&state.db, proposal_id, auth.user_id, input).await?;
    Ok(Json(score))
}

pub async fn get_score_summary(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
) -> Result<Json<Vec<ScoreSummary>>, AppError> {
    let summary = score_service::get_score_summary(&state.db, room_id, auth.user_id).await?;
    Ok(Json(summary))
}
