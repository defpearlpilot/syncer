import { apiFetch } from './client';
import { Proposal } from '../types';

export function getProposal(proposalId: string) {
  return apiFetch<Proposal>(`/api/proposals/${proposalId}`);
}

export function createProposal(roomId: string, title: string, body?: string) {
  return apiFetch<Proposal>(`/api/rooms/${roomId}/proposals`, {
    method: 'POST',
    body: JSON.stringify({ title, body }),
  });
}

export function listProposals(roomId: string) {
  return apiFetch<Proposal[]>(`/api/rooms/${roomId}/proposals`);
}

export function updateProposal(proposalId: string, data: { title?: string; body?: string }) {
  return apiFetch<Proposal>(`/api/proposals/${proposalId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProposal(proposalId: string) {
  return fetch(`/api/proposals/${proposalId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
