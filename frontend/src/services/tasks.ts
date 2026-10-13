import type { Task, TaskStatus } from '../api/types';
import { get, patch, post } from '../api/client';

export async function getTasks(projectId: string): Promise<Task[]> {
  return get<Task[]>(`/tasks?projectId=${encodeURIComponent(projectId)}`);
}

export type CreateTaskInput = {
  projectId: string;
  title: string;
  description?: string;
  assignedTo?: string | null;
  priority?: Task['priority'];
  deadline?: string | null;
  milestoneId?: string | null;
};

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return post<Task>('/tasks', input);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  return patch<Task>(`/tasks/${taskId}/status`, { status });
}

export async function completeTask(taskId: string): Promise<Task> {
  return post<Task>(`/tasks/${taskId}/completion`);
}

export async function updateTaskAssignment(taskId: string, input: Pick<CreateTaskInput, 'assignedTo' | 'deadline' | 'milestoneId'>): Promise<Task> {
  return patch<Task>(`/tasks/${encodeURIComponent(taskId)}/assignment`, input);
}
