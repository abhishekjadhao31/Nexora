import type { AppUser } from '../api/types';
import { get, post } from '../api/client';

export type AuthResponse = {
  user: AppUser;
  token: string;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', { email, password });
}

export async function register(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', { ...input, role: 'STUDENT' });
}

export async function getCurrentUser(): Promise<AppUser> {
  return get<AppUser>('/auth/me');
}
