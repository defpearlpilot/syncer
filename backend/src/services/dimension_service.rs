use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::dimension::{CreateDimensionInput, ScoringDimension, UpdateDimensionInput};
use crate::services::room_service;

type Db = sqlx::Postgres;

pub async fn create_dimension(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
    input: CreateDimensionInput,
) -> Result<ScoringDimension, AppError> {
    // Verify access
    room_service::get_room(db, room_id, user_id).await?;

    if input.name.is_empty() {
        return Err(AppError::BadRequest("Name is required".into()));
    }

    let valid_types = ["numeric_range", "t_shirt", "custom_labels"];
    if !valid_types.contains(&input.scale_type.as_str()) {
        return Err(AppError::BadRequest(
            "scale_type must be numeric_range, t_shirt, or custom_labels".into(),
        ));
    }

    // Get next position
    let max_pos = sqlx::query_scalar::<Db, Option<i32>>(
        "SELECT MAX(position) FROM scoring_dimensions WHERE room_id = $1",
    )
    .bind(room_id)
    .fetch_one(db)
    .await?;

    let position = max_pos.map(|p| p + 1).unwrap_or(0);

    let dimension = sqlx::query_as::<Db, ScoringDimension>(
        "INSERT INTO scoring_dimensions (room_id, name, scale_type, scale_config, weight, position)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    )
    .bind(room_id)
    .bind(&input.name)
    .bind(&input.scale_type)
    .bind(&input.scale_config)
    .bind(input.weight.unwrap_or(1.0))
    .bind(position)
    .fetch_one(db)
    .await?;

    Ok(dimension)
}

pub async fn list_dimensions(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<ScoringDimension>, AppError> {
    room_service::get_room(db, room_id, user_id).await?;

    let dimensions = sqlx::query_as::<Db, ScoringDimension>(
        "SELECT * FROM scoring_dimensions WHERE room_id = $1 ORDER BY position",
    )
    .bind(room_id)
    .fetch_all(db)
    .await?;

    Ok(dimensions)
}

pub async fn update_dimension(
    db: &PgPool,
    dimension_id: Uuid,
    user_id: Uuid,
    input: UpdateDimensionInput,
) -> Result<ScoringDimension, AppError> {
    let dim = sqlx::query_as::<Db, ScoringDimension>(
        "SELECT * FROM scoring_dimensions WHERE id = $1",
    )
    .bind(dimension_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Dimension not found".into()))?;

    // Verify access
    room_service::get_room(db, dim.room_id, user_id).await?;

    let name = input.name.unwrap_or(dim.name);
    let scale_type = input.scale_type.unwrap_or(dim.scale_type);
    let scale_config = input.scale_config.unwrap_or(dim.scale_config);
    let weight = input.weight.unwrap_or(dim.weight);

    let updated = sqlx::query_as::<Db, ScoringDimension>(
        "UPDATE scoring_dimensions SET name = $1, scale_type = $2, scale_config = $3, weight = $4, updated_at = now()
         WHERE id = $5 RETURNING *",
    )
    .bind(&name)
    .bind(&scale_type)
    .bind(&scale_config)
    .bind(weight)
    .bind(dimension_id)
    .fetch_one(db)
    .await?;

    Ok(updated)
}

pub async fn delete_dimension(
    db: &PgPool,
    dimension_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let dim = sqlx::query_as::<Db, ScoringDimension>(
        "SELECT * FROM scoring_dimensions WHERE id = $1",
    )
    .bind(dimension_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Dimension not found".into()))?;

    room_service::get_room(db, dim.room_id, user_id).await?;

    sqlx::query("DELETE FROM scoring_dimensions WHERE id = $1")
        .bind(dimension_id)
        .execute(db)
        .await?;

    Ok(())
}
