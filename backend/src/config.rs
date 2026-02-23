use anyhow::Result;

pub struct Config {
    pub database_url: String,
    pub session_secret: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")?,
            session_secret: std::env::var("SESSION_SECRET")?,
        })
    }
}
