use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::workspace::{
    CreateWorkspaceInput, InviteMemberInput, MemberInfo, Workspace, WorkspaceMember,
    WorkspaceWithMembers,
};

type Db = sqlx::Postgres;

pub async fn create_workspace(
    db: &PgPool,
    user_id: Uuid,
    input: CreateWorkspaceInput,
) -> Result<Workspace, AppError> {
    if input.name.is_empty() || input.slug.is_empty() {
        return Err(AppError::BadRequest("Name and slug are required".into()));
    }

    if !input
        .slug
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(AppError::BadRequest(
            "Slug must contain only lowercase letters, numbers, and hyphens".into(),
        ));
    }

    let existing =
        sqlx::query_scalar::<Db, i64>("SELECT COUNT(*) FROM workspaces WHERE slug = $1")
            .bind(&input.slug)
            .fetch_one(db)
            .await?;

    if existing > 0 {
        return Err(AppError::Conflict("Slug already taken".into()));
    }

    let workspace = sqlx::query_as::<Db, Workspace>(
        "INSERT INTO workspaces (name, slug, created_by) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(&input.name)
    .bind(&input.slug)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    // Add creator as owner
    sqlx::query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')")
        .bind(workspace.id)
        .bind(user_id)
        .execute(db)
        .await?;

    Ok(workspace)
}

pub async fn list_workspaces(db: &PgPool, user_id: Uuid) -> Result<Vec<Workspace>, AppError> {
    let workspaces = sqlx::query_as::<Db, Workspace>(
        "SELECT w.* FROM workspaces w
         INNER JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = $1
         ORDER BY w.created_at DESC",
    )
    .bind(user_id)
    .fetch_all(db)
    .await?;

    Ok(workspaces)
}

pub async fn get_workspace(
    db: &PgPool,
    workspace_id: Uuid,
    user_id: Uuid,
) -> Result<WorkspaceWithMembers, AppError> {
    let workspace = sqlx::query_as::<Db, Workspace>("SELECT * FROM workspaces WHERE id = $1")
        .bind(workspace_id)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound("Workspace not found".into()))?;

    // Check membership
    let is_member = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(workspace_id)
    .bind(user_id)
    .fetch_one(db)
    .await?;

    if is_member == 0 {
        return Err(AppError::Forbidden("Not a member of this workspace".into()));
    }

    let members = sqlx::query_as::<Db, MemberInfo>(
        "SELECT wm.user_id, u.display_name, u.email, wm.role, wm.joined_at
         FROM workspace_members wm
         INNER JOIN users u ON u.id = wm.user_id
         WHERE wm.workspace_id = $1
         ORDER BY wm.joined_at",
    )
    .bind(workspace_id)
    .fetch_all(db)
    .await?;

    Ok(WorkspaceWithMembers { workspace, members })
}

pub async fn invite_member(
    db: &PgPool,
    workspace_id: Uuid,
    inviter_id: Uuid,
    input: InviteMemberInput,
) -> Result<WorkspaceMember, AppError> {
    // Check inviter is admin or owner
    let inviter_role = sqlx::query_scalar::<Db, String>(
        "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(workspace_id)
    .bind(inviter_id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::Forbidden("Not a member of this workspace".into()))?;

    if inviter_role != "owner" && inviter_role != "admin" {
        return Err(AppError::Forbidden(
            "Only owners and admins can invite members".into(),
        ));
    }

    // Find user by email
    let user = sqlx::query_scalar::<Db, Uuid>("SELECT id FROM users WHERE email = $1")
        .bind(&input.email)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound("User not found with that email".into()))?;

    let role = input.role.unwrap_or_else(|| "member".to_string());
    if role != "member" && role != "admin" {
        return Err(AppError::BadRequest(
            "Role must be 'member' or 'admin'".into(),
        ));
    }

    // Check not already a member
    let existing = sqlx::query_scalar::<Db, i64>(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    )
    .bind(workspace_id)
    .bind(user)
    .fetch_one(db)
    .await?;

    if existing > 0 {
        return Err(AppError::Conflict("User is already a member".into()));
    }

    let member = sqlx::query_as::<Db, WorkspaceMember>(
        "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(workspace_id)
    .bind(user)
    .bind(&role)
    .fetch_one(db)
    .await?;

    Ok(member)
}
