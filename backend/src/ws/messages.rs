use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "payload")]
#[serde(rename_all = "snake_case")]
pub enum WsClientMessage {
    ProposalCreate {
        title: String,
        body: Option<String>,
    },
    ProposalUpdate {
        proposal_id: Uuid,
        title: Option<String>,
        body: Option<String>,
    },
    CommentCreate {
        body: String,
        proposal_id: Option<Uuid>,
        parent_id: Option<Uuid>,
    },
    ScoreUpsert {
        proposal_id: Uuid,
        dimension_id: Uuid,
        value: f32,
    },
    RoomTransition,
    Ping,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", content = "payload")]
#[serde(rename_all = "snake_case")]
pub enum WsServerMessage {
    ProposalCreated(serde_json::Value),
    ProposalUpdated(serde_json::Value),
    CommentCreated(serde_json::Value),
    ScoreUpdated(serde_json::Value),
    StageChanged(serde_json::Value),
    DecisionMade(serde_json::Value),
    UserJoined { user_id: Uuid, display_name: String },
    UserLeft { user_id: Uuid },
    PresenceSync { users: Vec<PresenceUser> },
    Ack { request_id: String },
    Error { message: String },
    Pong,
}

#[derive(Debug, Clone, Serialize)]
pub struct PresenceUser {
    pub user_id: Uuid,
    pub display_name: String,
}

#[derive(Debug, Deserialize)]
pub struct WsEnvelope {
    #[serde(flatten)]
    pub message: WsClientMessage,
    pub request_id: Option<String>,
}
