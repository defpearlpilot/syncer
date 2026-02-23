use sqlx::PgPool;
use uuid::Uuid;

use super::manager::RoomManager;
use super::messages::PresenceUser;

type Db = sqlx::Postgres;

pub async fn get_presence_list(
    db: &PgPool,
    room_manager: &RoomManager,
    room_id: &Uuid,
) -> Vec<PresenceUser> {
    let user_ids = room_manager.get_present_user_ids(room_id);
    if user_ids.is_empty() {
        return vec![];
    }

    // Build a query with IN clause
    let mut users = Vec::new();
    for uid in &user_ids {
        if let Ok(name) = sqlx::query_scalar::<Db, String>(
            "SELECT display_name FROM users WHERE id = $1",
        )
        .bind(uid)
        .fetch_one(db)
        .await
        {
            users.push(PresenceUser {
                user_id: *uid,
                display_name: name,
            });
        }
    }

    users
}
