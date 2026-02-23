import { apiFetch } from './client';
import { Workspace, WorkspaceWithMembers, WorkspaceMember } from '../types';

export function createWorkspace(name: string, slug: string) {
  return apiFetch<Workspace>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  });
}

export function listWorkspaces() {
  return apiFetch<Workspace[]>('/api/workspaces');
}

export function getWorkspace(id: string) {
  return apiFetch<WorkspaceWithMembers>(`/api/workspaces/${id}`);
}

export function inviteMember(workspaceId: string, email: string, role?: string) {
  return apiFetch<WorkspaceMember>(`/api/workspaces/${workspaceId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}
