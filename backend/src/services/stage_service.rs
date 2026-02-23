use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::stage::{RoomStage, StageInput};
use crate::services::room_service;

type Db = sqlx::Postgres;

pub async fn get_stages(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<RoomStage>, AppError> {
    room_service::get_room(db, room_id, user_id).await?;

    let stages = sqlx::query_as::<Db, RoomStage>(
        "SELECT * FROM room_stages WHERE room_id = $1 ORDER BY position",
    )
    .bind(room_id)
    .fetch_all(db)
    .await?;

    Ok(stages)
}

pub async fn replace_stages(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
    stages: Vec<StageInput>,
) -> Result<Vec<RoomStage>, AppError> {
    let _room = room_service::get_room(db, room_id, user_id).await?;

    if stages.is_empty() {
        return Err(AppError::BadRequest("At least one stage is required".into()));
    }

    let valid_types = ["propose", "discuss", "score", "review", "decide", "open"];
    for s in &stages {
        if !valid_types.contains(&s.stage_type.as_str()) {
            return Err(AppError::BadRequest(format!(
                "Invalid stage type: {}",
                s.stage_type
            )));
        }
    }

    // Delete existing stages (resets current_stage_id first)
    sqlx::query("UPDATE decision_rooms SET current_stage_id = NULL WHERE id = $1")
        .bind(room_id)
        .execute(db)
        .await?;

    sqlx::query("DELETE FROM room_stages WHERE room_id = $1")
        .bind(room_id)
        .execute(db)
        .await?;

    let mut created = Vec::new();
    for (i, s) in stages.iter().enumerate() {
        let stage = sqlx::query_as::<Db, RoomStage>(
            "INSERT INTO room_stages (room_id, name, stage_type, position)
             VALUES ($1, $2, $3, $4) RETURNING *",
        )
        .bind(room_id)
        .bind(&s.name)
        .bind(&s.stage_type)
        .bind(i as i32)
        .fetch_one(db)
        .await?;
        created.push(stage);
    }

    // Set current stage to first
    sqlx::query("UPDATE decision_rooms SET current_stage_id = $1 WHERE id = $2")
        .bind(created[0].id)
        .bind(room_id)
        .execute(db)
        .await?;

    Ok(created)
}
