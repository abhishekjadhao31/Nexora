import { Router } from 'express';
import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import { getRequestUser, requireAuth, requireRole } from './middleware/auth-middleware.js';

export const taskRouter = Router();
taskRouter.use(requireAuth);

async function assertProjectMember(projectId: string, userId: string): Promise<void> {
  const result = await getDatabase().query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
  if (result.rowCount !== 1) throw new AppError(403, 'FORBIDDEN', 'You are not a member of this project');
}

async function assertTaskAccess(taskId: string, userId: string) {
  const result = await getDatabase().query(
    `SELECT t.id, t.project_id, t.assigned_to, t.title, t.description, t.status, t.priority, t.deadline,
            t.milestone_id, t.created_at, t.updated_at, t.completed_at
     FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id
     WHERE t.id = $1 AND pm.user_id = $2`,
    [taskId, userId]
  );
  if (!result.rows[0]) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found');
  return result.rows[0];
}

export async function listProjectTasks(projectId: string, userId: string) {
  await assertProjectMember(projectId, userId);
  const result = await getDatabase().query(
    `SELECT id, project_id, title, description, assigned_to, created_by, status, priority, deadline,
            milestone_id, created_at, updated_at, completed_at
     FROM tasks WHERE project_id = $1 ORDER BY deadline NULLS LAST, created_at DESC`,
    [projectId]
  );
  return result.rows;
}

taskRouter.get('/', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = request.query.projectId;
    if (typeof projectId !== 'string') throw new AppError(400, 'PROJECT_ID_REQUIRED', 'projectId is required');
    response.json({ data: await listProjectTasks(projectId, user.id) });
  } catch (error) {
    next(error);
  }
});

taskRouter.post('/', requireRole('PROFESSOR', 'TEAM_LEADER'), async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const { projectId, title, description = '', assignedTo = null, priority = 'MEDIUM', deadline = null, milestoneId = null } = request.body ?? {};
    if (typeof projectId !== 'string' || typeof title !== 'string' || title.trim().length < 2) throw new AppError(422, 'VALIDATION_ERROR', 'projectId and a task title are required');
    await assertProjectMember(projectId, user.id);
    const result = await getDatabase().query(
      `INSERT INTO tasks (project_id, title, description, assigned_to, created_by, priority, deadline, milestone_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, project_id, title, description, assigned_to, created_by, status, priority, deadline, milestone_id, created_at, updated_at, completed_at`,
      [projectId, title.trim(), description, assignedTo, user.id, priority, deadline, milestoneId]
    );
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

taskRouter.patch('/:taskId/status', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const task = await assertTaskAccess(request.params.taskId, user.id);
    if (task.assigned_to !== user.id && user.role === 'STUDENT') throw new AppError(403, 'FORBIDDEN', 'Students can only update their own tasks');
    const { status } = request.body ?? {};
    if (!['TO_DO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].includes(status)) throw new AppError(422, 'VALIDATION_ERROR', 'Invalid task status');
    const result = await getDatabase().query(
      `UPDATE tasks SET status = $1, completed_at = CASE WHEN $1 = 'COMPLETED' THEN now() ELSE NULL END, updated_at = now()
       WHERE id = $2 RETURNING id, project_id, title, status, priority, assigned_to, deadline, completed_at, updated_at`,
      [status, task.id]
    );
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

taskRouter.post('/:taskId/completion', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const task = await assertTaskAccess(request.params.taskId, user.id);
    if (task.assigned_to !== user.id && user.role === 'STUDENT') throw new AppError(403, 'FORBIDDEN', 'Students can only complete their own tasks');
    const result = await getDatabase().query(
      `UPDATE tasks SET status = 'COMPLETED', completed_at = now(), updated_at = now()
       WHERE id = $1 RETURNING id, project_id, title, status, completed_at, updated_at`,
      [task.id]
    );
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
