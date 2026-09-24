import type { Project } from '../api/types';
import { get, post } from './api';

export async function getProjects(): Promise<Project[]> {
  return get<Project[]>('/projects');
}

export async function createProject(input: Partial<Project> & { name: string }): Promise<Project> {
  return post<Project>('/projects', input);
}

export async function getProjectProgress(projectId: string): Promise<{ projectId: string; totalTasks: number; completedTasks: number; progress: number }> {
  return get(`/projects/${projectId}/progress`);
}
