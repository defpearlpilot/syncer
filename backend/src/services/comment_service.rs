use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::comment::{Comment, CommentWithAuthor, CreateCommentInput, UpdateCommentInput};
use crate::services::room_service;

type Db = sqlx::Postgres;

#[derive(sqlx::FromRow)]
struct CommentRow {
    id: Uuid,
    room_id: Uuid,
    proposal_id: Option<Uuid>,
    parent_id: Option<Uuid>,
    body: String,
    created_by: Uuid,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    author_name: String,
}

pub async fn create_comment(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
    input: CreateCommentInput,
) -> Result<Comment, AppError> {
    let room = room_service::get_room(db, room_id, user_id).await?;
    let stage_type = room_service::get_current_stage_type(&room);

    if stage_type != "discuss" && stage_type != "open" {
        return Err(AppError::BadRequest(
            "Comments can only be added during the discuss stage".into(),
        ));
    }

    if input.body.is_empty() {
        return Err(AppError::BadRequest("Comment body is required".into()));
    }

    // Validate parent_id is in same room
    if let Some(parent_id) = input.parent_id {
        let parent = sqlx::query_scalar::<Db, i64>(
            "SELECT COUNT(*) FROM comments WHERE id = $1 AND room_id = $2",
        )
        .bind(parent_id)
        .bind(room_id)
        .fetch_one(db)
        .await?;

        if parent == 0 {
            return Err(AppError::BadRequest("Parent comment not found in this room".into()));
        }
    }

    let comment = sqlx::query_as::<Db, Comment>(
        "INSERT INTO comments (room_id, proposal_id, parent_id, body, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *",
    )
    .bind(room_id)
    .bind(input.proposal_id)
    .bind(input.parent_id)
    .bind(&input.body)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    Ok(comment)
}

pub async fn list_comments(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<CommentWithAuthor>, AppError> {
    // Verify access
    room_service::get_room(db, room_id, user_id).await?;

    let rows = sqlx::query_as::<Db, CommentRow>(
        "SELECT c.*, u.display_name as author_name
         FROM comments c
         INNER JOIN users u ON u.id = c.created_by
         WHERE c.room_id = $1
         ORDER BY c.created_at",
    )
    .bind(room_id)
    .fetch_all(db)
    .await?;

    // Build threaded structure
    let all_comments: Vec<CommentWithAuthor> = rows
        .iter()
        .map(|r| CommentWithAuthor {
            comment: Comment {
                id: r.id,
                room_id: r.room_id,
                proposal_id: r.proposal_id,
                parent_id: r.parent_id,
                body: r.body.clone(),
                created_by: r.created_by,
                created_at: r.created_at,
                updated_at: r.updated_at,
            },
            author_name: r.author_name.clone(),
            replies: vec![],
        })
        .collect();

    // Separate top-level and replies
    let mut top_level: Vec<CommentWithAuthor> = Vec::new();
    let mut replies: Vec<CommentWithAuthor> = Vec::new();

    for c in all_comments {
        if c.comment.parent_id.is_none() {
            top_level.push(c);
        } else {
            replies.push(c);
        }
    }

    // Attach replies to parents
    for reply in replies {
        if let Some(parent) = top_level
            .iter_mut()
            .find(|p| Some(p.comment.id) == reply.comment.parent_id)
        {
            parent.replies.push(reply);
        }
    }

    Ok(top_level)
}

pub async fn update_comment(
    db: &PgPool,
    comment_id: Uuid,
    user_id: Uuid,
    input: UpdateCommentInput,
) -> Result<Comment, AppError> {
    let comment = sqlx::query_as::<Db, Comment>(
        "SELECT * FROM comments WHERE id = $1",
    )
    .bind(comment_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Comment not found".into()))?;

    if comment.created_by != user_id {
        return Err(AppError::Forbidden("You can only edit your own comments".into()));
    }

    let updated = sqlx::query_as::<Db, Comment>(
        "UPDATE comments SET body = $1, updated_at = now() WHERE id = $2 RETURNING *",
    )
    .bind(&input.body)
    .bind(comment_id)
    .fetch_one(db)
    .await?;

    Ok(updated)
}

pub async fn delete_comment(
    db: &PgPool,
    comment_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let comment = sqlx::query_as::<Db, Comment>(
        "SELECT * FROM comments WHERE id = $1",
    )
    .bind(comment_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Comment not found".into()))?;

    if comment.created_by != user_id {
        return Err(AppError::Forbidden(
            "You can only delete your own comments".into(),
        ));
    }

    sqlx::query("DELETE FROM comments WHERE id = $1")
        .bind(comment_id)
        .execute(db)
        .await?;

    Ok(())
}
