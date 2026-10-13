import type { AppUser, UserSearchResult } from '../api/types';
import { get } from '../api/client';

export async function getUsers(): Promise<AppUser[]> {
  return get<AppUser[]>('/users');
}

export async function searchUsers(search: string): Promise<UserSearchResult[]> {
  return get<UserSearchResult[]>('/users', { params: { search, limit: 20 } });
}
