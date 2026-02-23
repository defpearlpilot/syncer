use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::room::{CreateRoomInput, DecisionRoom, DecisionRoomWithStages, DecideInput, UpdateRoomInput};
use crate::models::stage::RoomStage;

type Db = sqlx::Postgres;

pub async fn create_room(
    db: &PgPool,
    workspace_id: Uuid,
    user_id: Uuid,
    input: CreateRoomInput,
) -> Result<DecisionRoomWithStages, AppError> {
    // Verify user is a workspace member
    let is_member = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(workspace_id)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    if is_member == 0 {
        return Err(AppError::Forbidden("Not a member of this workspace".into()));
    }

    if input.title.is_empty() {
        return Err(AppError::BadRequest("Title is required".into()));
    }

    let room = sqlx::query_as::<Db, DecisionRoom>(
        "INSERT INTO decision_rooms (workspace_id, title, description, created_by)
         VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(workspace_id)
    .bind(&input.title)
    .bind(input.description.as_deref().unwrap_or(""))
    .bind(user_id)
    .fetch_one(db)
    .await?;

    // Add creator as room member
    sqlx::query("INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)")
        .bind(room.id)
        .bind(user_id)
        .execute(db)
        .await?;

    Ok(DecisionRoomWithStages {
        room,
        stages: vec![],
        current_stage: None,
    })
}

pub async fn list_rooms(
    db: &PgPool,
    workspace_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<DecisionRoom>, AppError> {
    // Verify workspace membership
    let is_member = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(workspace_id)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    if is_member == 0 {
        return Err(AppError::Forbidden("Not a member of this workspace".into()));
    }

    let rooms = sqlx::query_as::<Db, DecisionRoom>(
        "SELECT * FROM decision_rooms WHERE workspace_id = $1 ORDER BY created_at DESC",
    )
    .bind(workspace_id)
    .fetch_all(db)
    .await?;

    Ok(rooms)
}

pub async fn get_room(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
) -> Result<DecisionRoomWithStages, AppError> {
    let room = sqlx::query_as::<Db, DecisionRoom>(
        "SELECT * FROM decision_rooms WHERE id = $1",
    )
    .bind(room_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Room not found".into()))?;

    // Check workspace membership
    let is_member = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(room.workspace_id)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    if is_member == 0 {
        return Err(AppError::Forbidden("Not a member of this workspace".into()));
    }

    // Auto-join room if not already a member
    sqlx::query(
        "INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(room_id)
    .bind(user_id)
    .execute(db)
    .await?;

    let stages = sqlx::query_as::<Db, RoomStage>(
        "SELECT * FROM room_stages WHERE room_id = $1 ORDER BY position",
    )
    .bind(room_id)
    .fetch_all(db)
    .await?;

    let current_stage = room
        .current_stage_id
        .and_then(|sid| stages.iter().find(|s| s.id == sid).cloned());

    Ok(DecisionRoomWithStages {
        room,
        stages,
        current_stage,
    })
}

pub async fn update_room(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
    input: UpdateRoomInput,
) -> Result<DecisionRoom, AppError> {
    let room = sqlx::query_as::<Db, DecisionRoom>(
        "SELECT * FROM decision_rooms WHERE id = $1",
    )
    .bind(room_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Room not found".into()))?;

    // Check workspace membership
    let is_member = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(room.workspace_id)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    if is_member == 0 {
        return Err(AppError::Forbidden("Not a member of this workspace".into()));
    }

    let title = input.title.unwrap_or(room.title);
    let description = input.description.unwrap_or(room.description);

    let updated = sqlx::query_as::<Db, DecisionRoom>(
        "UPDATE decision_rooms SET title = $1, description = $2, updated_at = now() WHERE id = $3 RETURNING *",
    )
    .bind(&title)
    .bind(&description)
    .bind(room_id)
    .fetch_one(db)
    .await?;

    Ok(updated)
}

pub async fn transition_stage(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
) -> Result<DecisionRoomWithStages, AppError> {
    let room = sqlx::query_as::<Db, DecisionRoom>(
        "SELECT * FROM decision_rooms WHERE id = $1",
    )
    .bind(room_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Room not found".into()))?;

    // Check workspace membership
    let is_member = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(room.workspace_id)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    if is_member == 0 {
        return Err(AppError::Forbidden("Not a member of this workspace".into()));
    }

    let stages = sqlx::query_as::<Db, RoomStage>(
        "SELECT * FROM room_stages WHERE room_id = $1 ORDER BY position",
    )
    .bind(room_id)
    .fetch_all(db)
    .await?;

    let current_idx = room
        .current_stage_id
        .and_then(|sid| stages.iter().position(|s| s.id == sid))
        .unwrap_or(0);

    if current_idx >= stages.len() - 1 {
        return Err(AppError::BadRequest("Already at the final stage".into()));
    }

    let next_stage = &stages[current_idx + 1];

    sqlx::query("UPDATE decision_rooms SET current_stage_id = $1, updated_at = now() WHERE id = $2")
        .bind(next_stage.id)
        .bind(room_id)
        .execute(db)
        .await?;

    let room = sqlx::query_as::<Db, DecisionRoom>("SELECT * FROM decision_rooms WHERE id = $1")
        .bind(room_id)
        .fetch_one(db)
        .await?;

    let current_stage = Some(next_stage.clone());

    Ok(DecisionRoomWithStages {
        room,
        stages,
        current_stage,
    })
}

pub async fn decide(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
    input: DecideInput,
) -> Result<DecisionRoom, AppError> {
    get_room(db, room_id, user_id).await?;

    // Verify proposal belongs to this room
    let proposal_exists = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM proposals WHERE id = $1 AND room_id = $2",
    )
    .bind(input.proposal_id)
    .bind(room_id)
    .fetch_one(db)
    .await?;

    if proposal_exists == 0 {
        return Err(AppError::NotFound("Proposal not found in this room".into()));
    }

    let updated = sqlx::query_as::<Db, DecisionRoom>(
        "UPDATE decision_rooms SET decided_proposal_id = $1, decision_summary = $2, decided_by = $3, decided_at = now(), updated_at = now() WHERE id = $4 RETURNING *",
    )
    .bind(input.proposal_id)
    .bind(input.summary.as_deref())
    .bind(user_id)
    .bind(room_id)
    .fetch_one(db)
    .await?;

    Ok(updated)
}

