import { apiFetch } from './client';
import { Score, ScoreSummary } from '../types';

export function upsertScore(proposalId: string, dimensionId: string, value: number) {
  return apiFetch<Score>(`/api/proposals/${proposalId}/scores`, {
    method: 'PUT',
    body: JSON.stringify({ dimension_id: dimensionId, value }),
  });
}

export function getScoreSummary(roomId: string) {
  return apiFetch<ScoreSummary[]>(`/api/rooms/${roomId}/scores/summary`);
}
