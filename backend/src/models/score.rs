use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Score {
    pub id: Uuid,
    pub proposal_id: Uuid,
    pub dimension_id: Uuid,
    pub user_id: Uuid,
    pub value: f32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertScoreInput {
    pub dimension_id: Uuid,
    pub value: f32,
}

#[derive(Debug, Serialize)]
pub struct ScoreSummary {
    pub proposal_id: Uuid,
    pub proposal_title: String,
    pub dimensions: Vec<DimensionScore>,
    pub weighted_average: f64,
}

#[derive(Debug, Serialize)]
pub struct DimensionScore {
    pub dimension_id: Uuid,
    pub dimension_name: String,
    pub weight: f32,
    pub average: f64,
    pub user_score: Option<f32>,
    pub count: i64,
}
