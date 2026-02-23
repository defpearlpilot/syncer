use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Workspace {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct WorkspaceMember {
    pub workspace_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct WorkspaceWithMembers {
    #[serde(flatten)]
    pub workspace: Workspace,
    pub members: Vec<MemberInfo>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MemberInfo {
    pub user_id: Uuid,
    pub display_name: String,
    pub email: String,
    pub role: String,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkspaceInput {
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Deserialize)]
pub struct InviteMemberInput {
    pub email: String,
    pub role: Option<String>,
}
