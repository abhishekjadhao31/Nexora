import type { Milestone } from '../api/types';
import { get } from '../api/client';

export async function getProjectMilestones(projectId: string): Promise<Milestone[]> {
  return get<Milestone[]>(`/milestones/project/${encodeURIComponent(projectId)}`);
}