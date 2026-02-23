use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use tower_sessions::Session;
use uuid::Uuid;

use crate::error::AppError;

const USER_ID_KEY: &str = "user_id";

pub struct AuthUser {
    pub user_id: Uuid,
}

impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let session = Session::from_request_parts(parts, state)
            .await
            .map_err(|_| AppError::Unauthorized)?;

        let user_id: Uuid = session
            .get(USER_ID_KEY)
            .await
            .map_err(|_| AppError::Unauthorized)?
            .ok_or(AppError::Unauthorized)?;

        Ok(AuthUser { user_id })
    }
}

pub async fn set_session_user(session: &Session, user_id: Uuid) -> Result<(), AppError> {
    session
        .insert(USER_ID_KEY, user_id)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;
    Ok(())
}
