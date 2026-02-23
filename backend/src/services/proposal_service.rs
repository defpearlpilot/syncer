use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::proposal::{CreateProposalInput, Proposal, UpdateProposalInput};
use crate::services::room_service;

type Db = sqlx::Postgres;

pub async fn create_proposal(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
    input: CreateProposalInput,
) -> Result<Proposal, AppError> {
    // Verify access
    room_service::get_room(db, room_id, user_id).await?;

    if input.title.is_empty() {
        return Err(AppError::BadRequest("Title is required".into()));
    }

    let proposal = sqlx::query_as::<Db, Proposal>(
        "INSERT INTO proposals (room_id, title, body, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(room_id)
    .bind(&input.title)
    .bind(input.body.as_deref().unwrap_or(""))
    .bind(user_id)
    .fetch_one(db)
    .await?;

    Ok(proposal)
}

pub async fn list_proposals(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<Proposal>, AppError> {
    // Verify access
    room_service::get_room(db, room_id, user_id).await?;

    let proposals = sqlx::query_as::<Db, Proposal>(
        "SELECT * FROM proposals WHERE room_id = $1 ORDER BY created_at",
    )
    .bind(room_id)
    .fetch_all(db)
    .await?;

    Ok(proposals)
}

pub async fn update_proposal(
    db: &PgPool,
    proposal_id: Uuid,
    user_id: Uuid,
    input: UpdateProposalInput,
) -> Result<Proposal, AppError> {
    let proposal = sqlx::query_as::<Db, Proposal>(
        "SELECT * FROM proposals WHERE id = $1",
    )
    .bind(proposal_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Proposal not found".into()))?;

    if proposal.created_by != user_id {
        return Err(AppError::Forbidden("You can only edit your own proposals".into()));
    }

    let title = input.title.unwrap_or(proposal.title);
    let body = input.body.unwrap_or(proposal.body);

    let updated = sqlx::query_as::<Db, Proposal>(
        "UPDATE proposals SET title = $1, body = $2, updated_at = now() WHERE id = $3 RETURNING *",
    )
    .bind(&title)
    .bind(&body)
    .bind(proposal_id)
    .fetch_one(db)
    .await?;

    Ok(updated)
}

pub async fn delete_proposal(
    db: &PgPool,
    proposal_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let proposal = sqlx::query_as::<Db, Proposal>(
        "SELECT * FROM proposals WHERE id = $1",
    )
    .bind(proposal_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Proposal not found".into()))?;

    if proposal.created_by != user_id {
        return Err(AppError::Forbidden(
            "You can only delete your own proposals".into(),
        ));
    }

    sqlx::query("DELETE FROM proposals WHERE id = $1")
        .bind(proposal_id)
        .execute(db)
        .await?;

    Ok(())
}
