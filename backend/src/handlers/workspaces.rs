use axum::extract::{Path, State};
use axum::Json;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::workspace::{
    CreateWorkspaceInput, InviteMemberInput, Workspace, WorkspaceMember, WorkspaceWithMembers,
};
use crate::services::workspace_service;
use crate::AppState;

pub async fn create_workspace(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(input): Json<CreateWorkspaceInput>,
) -> Result<Json<Workspace>, AppError> {
    let workspace = workspace_service::create_workspace(&state.db, auth.user_id, input).await?;
    Ok(Json(workspace))
}

pub async fn list_workspaces(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<Workspace>>, AppError> {
    let workspaces = workspace_service::list_workspaces(&state.db, auth.user_id).await?;
    Ok(Json(workspaces))
}

pub async fn get_workspace(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<WorkspaceWithMembers>, AppError> {
    let workspace = workspace_service::get_workspace(&state.db, id, auth.user_id).await?;
    Ok(Json(workspace))
}

pub async fn invite_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(input): Json<InviteMemberInput>,
) -> Result<Json<WorkspaceMember>, AppError> {
    let member = workspace_service::invite_member(&state.db, id, auth.user_id, input).await?;
    Ok(Json(member))
}
