import type { Task, TaskStatus } from '../api/types';
import { get, patch, post } from './api';

export async function getTasks(projectId: string): Promise<Task[]> {
  return get<Task[]>(`/tasks?projectId=${encodeURIComponent(projectId)}`);
}

export async function createTask(input: Partial<Task> & { projectId: string; title: string }): Promise<Task> {
  return post<Task>('/tasks', input);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  return patch<Task>(`/tasks/${taskId}/status`, { status });
}

export async function completeTask(taskId: string): Promise<Task> {
  return post<Task>(`/tasks/${taskId}/completion`);
}
