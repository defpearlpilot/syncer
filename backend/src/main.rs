use std::sync::Arc;

use backend::ws::manager::RoomManager;
use backend::AppState;
use time::Duration;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tower_sessions::cookie::SameSite;
use tower_sessions::{Expiry, SessionManagerLayer};
use tower_sessions_sqlx_store::PostgresStore;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,backend=debug")),
        )
        .init();

    let config = backend::config::Config::from_env()?;
    let pool = backend::db::init_pool(&config.database_url).await?;
    backend::db::run_migrations(&pool).await?;

    // Session store
    let session_store = PostgresStore::new(pool.clone());
    session_store.migrate().await?;

    let session_layer = SessionManagerLayer::new(session_store)
        .with_expiry(Expiry::OnInactivity(Duration::days(7)))
        .with_same_site(SameSite::Lax)
        .with_secure(false);

    // CORS (permissive for dev)
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let state = AppState {
        db: pool,
        room_manager: Arc::new(RoomManager::new()),
    };
    let app = backend::routes::build_router(state)
        .layer(TraceLayer::new_for_http())
        .layer(session_layer)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3100").await?;
    tracing::info!("Server running on http://localhost:3100");
    axum::serve(listener, app).await?;

    Ok(())
}
