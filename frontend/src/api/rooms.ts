import { apiFetch } from './client';
import { DecisionRoom, DecisionRoomWithStages, RoomStage } from '../types';

export function createRoom(workspaceId: string, title: string, description?: string) {
  return apiFetch<DecisionRoomWithStages>(`/api/workspaces/${workspaceId}/rooms`, {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
}

export function listRooms(workspaceId: string) {
  return apiFetch<DecisionRoom[]>(`/api/workspaces/${workspaceId}/rooms`);
}

export function getRoom(roomId: string) {
  return apiFetch<DecisionRoomWithStages>(`/api/rooms/${roomId}`);
}

export function updateRoom(roomId: string, data: { title?: string; description?: string }) {
  return apiFetch<DecisionRoom>(`/api/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function transitionStage(roomId: string) {
  return apiFetch<DecisionRoomWithStages>(`/api/rooms/${roomId}/transition`, {
    method: 'POST',
  });
}

export function decide(roomId: string, proposalId: string, summary?: string) {
  return apiFetch<DecisionRoom>(`/api/rooms/${roomId}/decide`, {
    method: 'POST',
    body: JSON.stringify({ proposal_id: proposalId, summary }),
  });
}

export function getStages(roomId: string) {
  return apiFetch<RoomStage[]>(`/api/rooms/${roomId}/stages`);
}

export function replaceStages(roomId: string, stages: { name: string; stage_type: string }[]) {
  return apiFetch<RoomStage[]>(`/api/rooms/${roomId}/stages`, {
    method: 'PUT',
    body: JSON.stringify(stages),
  });
}
