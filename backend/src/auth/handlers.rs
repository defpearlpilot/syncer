use axum::extract::State;
use axum::Json;
use tower_sessions::Session;

use crate::auth::middleware::{set_session_user, AuthUser};
use crate::auth::password;
use crate::error::AppError;
use crate::models::user::{LoginInput, RegisterInput, UserPublic};
use crate::AppState;

type Db = sqlx::Postgres;

pub async fn register(
    State(state): State<AppState>,
    session: Session,
    Json(input): Json<RegisterInput>,
) -> Result<Json<UserPublic>, AppError> {
    if input.email.is_empty() || input.password.is_empty() || input.display_name.is_empty() {
        return Err(AppError::BadRequest("All fields are required".into()));
    }

    if input.password.len() < 8 {
        return Err(AppError::BadRequest(
            "Password must be at least 8 characters".into(),
        ));
    }

    let existing = sqlx::query_scalar::<Db, i64>("SELECT COUNT(*) FROM users WHERE email = $1")
        .bind(&input.email)
        .fetch_one(&state.db)
        .await?;

    if existing > 0 {
        return Err(AppError::Conflict("Email already registered".into()));
    }

    let hash = password::hash_password(&input.password)?;

    let user = sqlx::query_as::<Db, crate::models::user::User>(
        "INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(&input.email)
    .bind(&input.display_name)
    .bind(&hash)
    .fetch_one(&state.db)
    .await?;

    set_session_user(&session, user.id).await?;

    Ok(Json(UserPublic::from(user)))
}

pub async fn login(
    State(state): State<AppState>,
    session: Session,
    Json(input): Json<LoginInput>,
) -> Result<Json<UserPublic>, AppError> {
    let user = sqlx::query_as::<Db, crate::models::user::User>(
        "SELECT * FROM users WHERE email = $1",
    )
    .bind(&input.email)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    if !password::verify_password(&input.password, &user.password_hash)? {
        return Err(AppError::Unauthorized);
    }

    set_session_user(&session, user.id).await?;

    Ok(Json(UserPublic::from(user)))
}

pub async fn logout(session: Session) -> Result<Json<serde_json::Value>, AppError> {
    session.flush().await.map_err(|e| AppError::Internal(e.into()))?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<UserPublic>, AppError> {
    let user = sqlx::query_as::<Db, crate::models::user::User>(
        "SELECT * FROM users WHERE id = $1",
    )
    .bind(auth.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("User not found".into()))?;

    Ok(Json(UserPublic::from(user)))
}
