import type { Notification } from '../api/types';
import { get, patch } from './api';

export async function getNotifications(): Promise<Notification[]> {
  return get<Notification[]>('/notifications');
}

export async function markNotificationRead(notificationId: string, read = true): Promise<Notification> {
  return patch<Notification>(`/notifications/${notificationId}`, { read });
}
