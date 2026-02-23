use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Comment {
    pub id: Uuid,
    pub room_id: Uuid,
    pub proposal_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
    pub body: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct CommentWithAuthor {
    #[serde(flatten)]
    pub comment: Comment,
    pub author_name: String,
    pub replies: Vec<CommentWithAuthor>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentInput {
    pub body: String,
    pub proposal_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCommentInput {
    pub body: String,
}
