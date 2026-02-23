use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct ScoringDimension {
    pub id: Uuid,
    pub room_id: Uuid,
    pub name: String,
    pub scale_type: String,
    pub scale_config: serde_json::Value,
    pub weight: f32,
    pub position: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDimensionInput {
    pub name: String,
    pub scale_type: String,
    pub scale_config: serde_json::Value,
    pub weight: Option<f32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDimensionInput {
    pub name: Option<String>,
    pub scale_type: Option<String>,
    pub scale_config: Option<serde_json::Value>,
    pub weight: Option<f32>,
}
