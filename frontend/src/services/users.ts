import type { AppUser } from '../api/types';
import { get } from './api';

export async function getUsers(): Promise<AppUser[]> {
  return get<AppUser[]>('/users');
}
