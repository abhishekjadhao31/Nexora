import type { AppUser } from '../api/types';
import { post } from './api';

export type AuthResponse = {
  user: AppUser;
  token: string;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', { email, password });
}

export async function register(input: { name: string; email: string; password: string; role: AppUser['role'] }): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', input);
}

export async function getCurrentUser(): Promise<AppUser> {
  return post<AppUser>('/auth/me');
}
