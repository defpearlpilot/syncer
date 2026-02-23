use dashmap::DashMap;
use std::collections::HashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

use super::messages::WsServerMessage;

type Sender = mpsc::UnboundedSender<WsServerMessage>;

pub struct RoomManager {
    rooms: DashMap<Uuid, HashMap<Uuid, Sender>>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: DashMap::new(),
        }
    }

    pub fn join(&self, room_id: Uuid, user_id: Uuid, sender: Sender) {
        self.rooms.entry(room_id).or_default().insert(user_id, sender);
    }

    pub fn leave(&self, room_id: Uuid, user_id: &Uuid) {
        if let Some(mut room) = self.rooms.get_mut(&room_id) {
            room.remove(user_id);
            if room.is_empty() {
                drop(room);
                self.rooms.remove(&room_id);
            }
        }
    }

    pub fn broadcast(&self, room_id: &Uuid, message: WsServerMessage) {
        if let Some(room) = self.rooms.get(room_id) {
            for sender in room.values() {
                let _ = sender.send(message.clone());
            }
        }
    }

    pub fn broadcast_except(&self, room_id: &Uuid, exclude_user: &Uuid, message: WsServerMessage) {
        if let Some(room) = self.rooms.get(room_id) {
            for (uid, sender) in room.iter() {
                if uid != exclude_user {
                    let _ = sender.send(message.clone());
                }
            }
        }
    }

    pub fn send_to(&self, room_id: &Uuid, user_id: &Uuid, message: WsServerMessage) {
        if let Some(room) = self.rooms.get(room_id) {
            if let Some(sender) = room.get(user_id) {
                let _ = sender.send(message);
            }
        }
    }

    pub fn get_present_user_ids(&self, room_id: &Uuid) -> Vec<Uuid> {
        self.rooms
            .get(room_id)
            .map(|room| room.keys().copied().collect())
            .unwrap_or_default()
    }
}
