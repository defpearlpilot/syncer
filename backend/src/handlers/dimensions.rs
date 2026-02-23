use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::dimension::{CreateDimensionInput, ScoringDimension, UpdateDimensionInput};
use crate::services::dimension_service;
use crate::AppState;

pub async fn create_dimension(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
    Json(input): Json<CreateDimensionInput>,
) -> Result<Json<ScoringDimension>, AppError> {
    let dim = dimension_service::create_dimension(&state.db, room_id, auth.user_id, input).await?;
    Ok(Json(dim))
}

pub async fn list_dimensions(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
) -> Result<Json<Vec<ScoringDimension>>, AppError> {
    let dims = dimension_service::list_dimensions(&state.db, room_id, auth.user_id).await?;
    Ok(Json(dims))
}

pub async fn update_dimension(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(dimension_id): Path<Uuid>,
    Json(input): Json<UpdateDimensionInput>,
) -> Result<Json<ScoringDimension>, AppError> {
    let dim = dimension_service::update_dimension(&state.db, dimension_id, auth.user_id, input).await?;
    Ok(Json(dim))
}

pub async fn delete_dimension(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(dimension_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    dimension_service::delete_dimension(&state.db, dimension_id, auth.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
