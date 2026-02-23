import { apiFetch } from './client';
import { User } from '../types';

export function register(email: string, display_name: string, password: string) {
  return apiFetch<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, display_name, password }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function getMe() {
  return apiFetch<User>('/api/auth/me');
}
