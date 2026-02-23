pub mod auth;
pub mod config;
pub mod db;
pub mod error;
pub mod handlers;
pub mod models;
pub mod routes;
pub mod services;
pub mod ws;

use std::sync::Arc;

use sqlx::PgPool;
use ws::manager::RoomManager;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub room_manager: Arc<RoomManager>,
}
