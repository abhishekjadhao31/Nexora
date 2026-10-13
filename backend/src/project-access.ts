import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import type { AuthUser } from './auth.js';

export type ProjectRole = 'LEADER' | 'MEMBER';

export async function getProjectMembership(projectId: string, userId: string): Promise<ProjectRole | null> {
  const result = await getDatabase().query<{ project_role: ProjectRole }>(
    'SELECT project_role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId],
  );
  return result.rows[0]?.project_role ?? null;
}

export async function requireProjectMember(projectId: string, userId: string): Promise<ProjectRole> {
  const role = await getProjectMembership(projectId, userId);
  if (!role) throw new AppError(403, 'FORBIDDEN', 'You are not a member of this project');
  return role;
}

export async function requireProjectLeader(projectId: string, user: AuthUser): Promise<void> {
  const role = await getProjectMembership(projectId, user.id);
  if (role !== 'LEADER') throw new AppError(403, 'FORBIDDEN', 'Project leader access is required');
}

export async function requireProjectViewer(projectId: string, user: AuthUser): Promise<void> {
  const membership = await getProjectMembership(projectId, user.id);
  if (membership) return;
  const supervisor = await getDatabase().query(
    'SELECT 1 FROM project_supervisors WHERE project_id = $1 AND supervisor_id = $2',
    [projectId, user.id],
  );
  if (supervisor.rowCount !== 1) throw new AppError(403, 'FORBIDDEN', 'You are not authorized to view this project');
}

export async function requireProfessor(user: AuthUser): Promise<void> {
  if (user.role !== 'PROFESSOR') throw new AppError(403, 'FORBIDDEN', 'A professor account is required');
}