use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct RoomStage {
    pub id: Uuid,
    pub room_id: Uuid,
    pub name: String,
    pub stage_type: String,
    pub position: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct StageInput {
    pub name: String,
    pub stage_type: String,
}
