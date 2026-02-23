import { apiFetch } from './client';
import { Comment } from '../types';

interface CommentWithAuthor extends Comment {
  author_name: string;
  replies: CommentWithAuthor[];
}

export function createComment(roomId: string, body: string, proposalId?: string, parentId?: string) {
  return apiFetch<Comment>(`/api/rooms/${roomId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, proposal_id: proposalId, parent_id: parentId }),
  });
}

export function listComments(roomId: string) {
  return apiFetch<CommentWithAuthor[]>(`/api/rooms/${roomId}/comments`);
}

export function updateComment(commentId: string, body: string) {
  return apiFetch<Comment>(`/api/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
}

export function deleteComment(commentId: string) {
  return fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
