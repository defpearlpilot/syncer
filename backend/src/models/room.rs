use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct DecisionRoom {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub title: String,
    pub description: String,
    pub current_stage_id: Option<Uuid>,
    pub created_by: Uuid,
    pub decided_proposal_id: Option<Uuid>,
    pub decision_summary: Option<String>,
    pub decided_by: Option<Uuid>,
    pub decided_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct DecisionRoomWithStages {
    #[serde(flatten)]
    pub room: DecisionRoom,
    pub stages: Vec<super::stage::RoomStage>,
    pub current_stage: Option<super::stage::RoomStage>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRoomInput {
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRoomInput {
    pub title: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DecideInput {
    pub proposal_id: Uuid,
    pub summary: Option<String>,
}
