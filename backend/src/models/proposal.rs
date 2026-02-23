use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Proposal {
    pub id: Uuid,
    pub room_id: Uuid,
    pub title: String,
    pub body: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProposalInput {
    pub title: String,
    pub body: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProposalInput {
    pub title: Option<String>,
    pub body: Option<String>,
}
