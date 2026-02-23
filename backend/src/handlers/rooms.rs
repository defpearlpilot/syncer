use axum::extract::{Path, State};
use axum::Json;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::room::{CreateRoomInput, DecideInput, DecisionRoom, DecisionRoomWithStages, UpdateRoomInput};
use crate::models::stage::{RoomStage, StageInput};
use crate::services::{room_service, stage_service};
use crate::AppState;

pub async fn create_room(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Json(input): Json<CreateRoomInput>,
) -> Result<Json<DecisionRoomWithStages>, AppError> {
    let room = room_service::create_room(&state.db, workspace_id, auth.user_id, input).await?;
    Ok(Json(room))
}

pub async fn list_rooms(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<Json<Vec<DecisionRoom>>, AppError> {
    let rooms = room_service::list_rooms(&state.db, workspace_id, auth.user_id).await?;
    Ok(Json(rooms))
}

pub async fn get_room(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
) -> Result<Json<DecisionRoomWithStages>, AppError> {
    let room = room_service::get_room(&state.db, room_id, auth.user_id).await?;
    Ok(Json(room))
}

pub async fn update_room(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
    Json(input): Json<UpdateRoomInput>,
) -> Result<Json<DecisionRoom>, AppError> {
    let room = room_service::update_room(&state.db, room_id, auth.user_id, input).await?;
    Ok(Json(room))
}

pub async fn transition_stage(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
) -> Result<Json<DecisionRoomWithStages>, AppError> {
    let room = room_service::transition_stage(&state.db, room_id, auth.user_id).await?;
    Ok(Json(room))
}

pub async fn decide(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
    Json(input): Json<DecideInput>,
) -> Result<Json<DecisionRoom>, AppError> {
    let room = room_service::decide(&state.db, room_id, auth.user_id, input).await?;
    Ok(Json(room))
}

pub async fn get_stages(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
) -> Result<Json<Vec<RoomStage>>, AppError> {
    let stages = stage_service::get_stages(&state.db, room_id, auth.user_id).await?;
    Ok(Json(stages))
}

pub async fn replace_stages(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(room_id): Path<Uuid>,
    Json(stages): Json<Vec<StageInput>>,
) -> Result<Json<Vec<RoomStage>>, AppError> {
    let stages = stage_service::replace_stages(&state.db, room_id, auth.user_id, stages).await?;
    Ok(Json(stages))
}
