import { apiFetch } from './client';
import { ScoringDimension } from '../types';

export function createDimension(roomId: string, data: {
  name: string;
  scale_type: string;
  scale_config: any;
  weight?: number;
}) {
  return apiFetch<ScoringDimension>(`/api/rooms/${roomId}/dimensions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function listDimensions(roomId: string) {
  return apiFetch<ScoringDimension[]>(`/api/rooms/${roomId}/dimensions`);
}

export function updateDimension(dimensionId: string, data: {
  name?: string;
  scale_type?: string;
  scale_config?: any;
  weight?: number;
}) {
  return apiFetch<ScoringDimension>(`/api/dimensions/${dimensionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteDimension(dimensionId: string) {
  return fetch(`/api/dimensions/${dimensionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
