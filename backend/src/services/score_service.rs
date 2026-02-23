use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::dimension::ScoringDimension;
use crate::models::proposal::Proposal;
use crate::models::score::{DimensionScore, Score, ScoreSummary, UpsertScoreInput};
use crate::services::room_service;

type Db = sqlx::Postgres;

pub async fn upsert_score(
    db: &PgPool,
    proposal_id: Uuid,
    user_id: Uuid,
    input: UpsertScoreInput,
) -> Result<Score, AppError> {
    let proposal = sqlx::query_as::<Db, Proposal>(
        "SELECT * FROM proposals WHERE id = $1",
    )
    .bind(proposal_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Proposal not found".into()))?;

    // Verify access
    let room_with_stages = room_service::get_room(db, proposal.room_id, user_id).await?;

    // Verify dimension belongs to this workspace
    let dim = sqlx::query_as::<Db, ScoringDimension>(
        "SELECT * FROM scoring_dimensions WHERE id = $1 AND workspace_id = $2",
    )
    .bind(input.dimension_id)
    .bind(room_with_stages.room.workspace_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Dimension not found in this workspace".into()))?;

    // Validate value is within scale range
    validate_score_value(&dim, input.value)?;

    let score = sqlx::query_as::<Db, Score>(
        "INSERT INTO scores (proposal_id, dimension_id, user_id, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (proposal_id, dimension_id, user_id)
         DO UPDATE SET value = $4, updated_at = now()
         RETURNING *",
    )
    .bind(proposal_id)
    .bind(input.dimension_id)
    .bind(user_id)
    .bind(input.value)
    .fetch_one(db)
    .await?;

    Ok(score)
}

fn validate_score_value(dim: &ScoringDimension, value: f32) -> Result<(), AppError> {
    match dim.scale_type.as_str() {
        "numeric_range" => {
            if let (Some(min), Some(max)) = (
                dim.scale_config.get("min").and_then(|v| v.as_f64()),
                dim.scale_config.get("max").and_then(|v| v.as_f64()),
            ) {
                if (value as f64) < min || (value as f64) > max {
                    return Err(AppError::BadRequest(format!(
                        "Value must be between {} and {}",
                        min, max
                    )));
                }
            }
        }
        "t_shirt" => {
            if let Some(values) = dim.scale_config.get("values").and_then(|v| v.as_array()) {
                let valid: Vec<f64> = values.iter().filter_map(|v| v.as_f64()).collect();
                if !valid.contains(&(value as f64)) {
                    return Err(AppError::BadRequest(format!(
                        "Value must be one of {:?}",
                        valid
                    )));
                }
            }
        }
        "custom_labels" => {
            if let Some(options) = dim.scale_config.get("options").and_then(|v| v.as_array()) {
                let valid: Vec<f64> = options
                    .iter()
                    .filter_map(|o| o.get("value").and_then(|v| v.as_f64()))
                    .collect();
                if !valid.contains(&(value as f64)) {
                    return Err(AppError::BadRequest(format!(
                        "Value must be one of {:?}",
                        valid
                    )));
                }
            }
        }
        _ => {}
    }
    Ok(())
}

#[derive(sqlx::FromRow)]
struct ScoreAggRow {
    #[allow(dead_code)]
    dimension_id: Uuid,
    avg_value: Option<f64>,
    score_count: i64,
    user_value: Option<f32>,
}

pub async fn get_score_summary(
    db: &PgPool,
    room_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<ScoreSummary>, AppError> {
    let room_with_stages = room_service::get_room(db, room_id, user_id).await?;

    let proposals = sqlx::query_as::<Db, Proposal>(
        "SELECT * FROM proposals WHERE room_id = $1 ORDER BY created_at",
    )
    .bind(room_id)
    .fetch_all(db)
    .await?;

    let dimensions = sqlx::query_as::<Db, ScoringDimension>(
        "SELECT * FROM scoring_dimensions WHERE workspace_id = $1 ORDER BY position",
    )
    .bind(room_with_stages.room.workspace_id)
    .fetch_all(db)
    .await?;

    let mut summaries = Vec::new();

    for proposal in &proposals {
        let mut dim_scores = Vec::new();
        let mut total_weight: f64 = 0.0;
        let mut weighted_sum: f64 = 0.0;

        for dim in &dimensions {
            let row = sqlx::query_as::<Db, ScoreAggRow>(
                "SELECT
                    $2::uuid as dimension_id,
                    AVG(s.value)::float8 as avg_value,
                    COUNT(s.id) as score_count,
                    (SELECT value FROM scores WHERE proposal_id = $1 AND dimension_id = $2 AND user_id = $3) as user_value
                 FROM scores s
                 WHERE s.proposal_id = $1 AND s.dimension_id = $2",
            )
            .bind(proposal.id)
            .bind(dim.id)
            .bind(user_id)
            .fetch_one(db)
            .await?;

            let avg = row.avg_value.unwrap_or(0.0);
            total_weight += dim.weight as f64;
            weighted_sum += avg * dim.weight as f64;

            dim_scores.push(DimensionScore {
                dimension_id: dim.id,
                dimension_name: dim.name.clone(),
                weight: dim.weight,
                average: avg,
                user_score: row.user_value,
                count: row.score_count,
            });
        }

        let weighted_average = if total_weight > 0.0 {
            weighted_sum / total_weight
        } else {
            0.0
        };

        summaries.push(ScoreSummary {
            proposal_id: proposal.id,
            proposal_title: proposal.title.clone(),
            dimensions: dim_scores,
            weighted_average,
        });
    }

    // Sort by weighted average descending
    summaries.sort_by(|a, b| b.weighted_average.partial_cmp(&a.weighted_average).unwrap_or(std::cmp::Ordering::Equal));

    Ok(summaries)
}
