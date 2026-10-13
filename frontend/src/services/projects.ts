import type { Project, ProjectMember } from '../api/types';
import { get, post } from '../api/client';

export async function getProjects(): Promise<Project[]> {
  return get<Project[]>('/projects');
}

export type CreateProjectInput = {
  name: string;
  description?: string;
  status?: Project['status'];
  startDate?: string | null;
  endDate?: string | null;
  members?: Array<Pick<ProjectMember, 'id' | 'projectRole'>>;
};

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return post<Project>('/projects', {
    ...input,
    members: input.members?.map((member) => ({ userId: member.id, projectRole: member.projectRole })),
  });
}

export async function getProject(projectId: string): Promise<Project> {
  return get<Project>(`/projects/${encodeURIComponent(projectId)}`);
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  return get<ProjectMember[]>(`/projects/${encodeURIComponent(projectId)}/members`);
}

export async function getProjectProgress(projectId: string): Promise<{ projectId: string; totalTasks: number; completedTasks: number; progress: number }> {
  return get(`/projects/${projectId}/progress`);
}
