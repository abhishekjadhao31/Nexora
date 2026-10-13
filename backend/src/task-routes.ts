import { Router } from 'express';
import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import { getRequestUser, requireAuth } from './middleware/auth-middleware.js';
import { mapTask } from './dtos.js';
import { enumValue, optionalDateTime, optionalString, optionalUuid, requireBody, requireString, requireUuid, requiredEnumValue, taskPriorities, taskStatuses } from './validation.js';
import { requireProjectLeader, requireProjectMember, requireProjectViewer } from './project-access.js';

export const taskRouter = Router();
taskRouter.use(requireAuth);

async function assertProjectMember(projectId: string, userId: string): Promise<void> {
  await requireProjectMember(projectId, userId);
}

async function loadTaskRow(taskId: string) {
  const result = await getDatabase().query(
    `SELECT t.id, t.project_id, t.assigned_to, t.created_by, t.title, t.description, t.status, t.priority, t.deadline,
            t.milestone_id, t.created_at, t.updated_at, t.completed_at,
            p.name AS project_name, assignee.name AS assignee_name, assignee.email AS assignee_email,
            milestone.name AS milestone_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
    LEFT JOIN users assignee ON assignee.id = t.assigned_to
    LEFT JOIN milestones milestone ON milestone.id = t.milestone_id
     WHERE t.id = $1`,
    [taskId],
  );
  if (!result.rows[0]) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found');
  return result.rows[0];
}

async function assertTaskAccess(taskId: string, userId: string) {
  const result = await getDatabase().query(
    `SELECT t.id, t.project_id, t.assigned_to, t.created_by, t.title, t.description, t.status, t.priority, t.deadline,
            t.milestone_id, t.created_at, t.updated_at, t.completed_at,
            p.name AS project_name, assignee.name AS assignee_name, assignee.email AS assignee_email,
            milestone.name AS milestone_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $2
    LEFT JOIN users assignee ON assignee.id = t.assigned_to
    LEFT JOIN milestones milestone ON milestone.id = t.milestone_id
     WHERE t.id = $1`,
    [taskId, userId],
  );
  if (!result.rows[0]) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found');
  return result.rows[0];
}

export async function listProjectTasks(projectId: string, userId: string, assignedToMe = false) {
  const user = { id: userId } as Parameters<typeof requireProjectViewer>[1];
  await requireProjectViewer(projectId, user);
  const result = await getDatabase().query(
    `SELECT t.id, t.project_id, t.title, t.description, t.assigned_to, t.created_by, t.status, t.priority, t.deadline,
            t.milestone_id, t.created_at, t.updated_at, t.completed_at,
            p.name AS project_name, assignee.name AS assignee_name, assignee.email AS assignee_email,
            milestone.name AS milestone_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
    LEFT JOIN users assignee ON assignee.id = t.assigned_to
    LEFT JOIN milestones milestone ON milestone.id = t.milestone_id
    WHERE t.project_id = $1 AND ($2 = false OR t.assigned_to = $3)
    ORDER BY t.deadline NULLS LAST, t.created_at DESC`,
      [projectId, assignedToMe, userId],
  );
  return result.rows.map(mapTask);
}

taskRouter.get('/', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = request.query.projectId;
    if (typeof projectId !== 'string') throw new AppError(400, 'PROJECT_ID_REQUIRED', 'projectId is required');
    const assignedToMe = request.query.assignedToMe === 'true';
    response.json({ data: await listProjectTasks(requireUuid(projectId, 'projectId'), user.id, assignedToMe) });
  } catch (error) {
    next(error);
  }
});

taskRouter.post('/', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const body = requireBody(request.body);
    const projectId = requireUuid(body.projectId, 'projectId');
    const title = requireString(body.title, 'title', 2, 200);
    const description = optionalString(body.description, 'description', 5000);
    const assignedTo = optionalUuid(body.assignedTo, 'assignedTo');
    const priority = enumValue(body.priority, 'priority', taskPriorities, 'MEDIUM');
    const deadline = optionalDateTime(body.deadline, 'deadline');
    const milestoneId = optionalUuid(body.milestoneId, 'milestoneId');
    await requireProjectLeader(projectId, user);
    if (assignedTo) await assertProjectMember(projectId, assignedTo);
    if (milestoneId) {
      const milestone = await getDatabase().query('SELECT 1 FROM milestones WHERE id = $1 AND project_id = $2', [milestoneId, projectId]);
      if (!milestone.rows[0]) throw new AppError(422, 'INVALID_MILESTONE', 'The milestone does not belong to this project');
    }
    const result = await getDatabase().query<{ id: string }>(
      `INSERT INTO tasks (project_id, title, description, assigned_to, created_by, priority, deadline, milestone_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [projectId, title, description, assignedTo, user.id, priority, deadline, milestoneId],
    );
    response.status(201).json({ data: mapTask(await loadTaskRow(result.rows[0].id)) });
  } catch (error) {
    next(error);
  }
});

taskRouter.patch('/:taskId/status', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const taskId = requireUuid(request.params.taskId, 'taskId');
    const task = await assertTaskAccess(taskId, user.id);
    await requireProjectMember(task.project_id, user.id);
    if (task.assigned_to !== user.id) throw new AppError(403, 'FORBIDDEN', 'Only the assigned member can execute this task');
    const body = requireBody(request.body);
    const status = requiredEnumValue(body.status, 'status', taskStatuses);
    const result = await getDatabase().query<{ id: string }>(
      `UPDATE tasks SET status = $1, completed_at = CASE WHEN $1 = 'COMPLETED' THEN now() ELSE NULL END, updated_at = now()
       WHERE id = $2 RETURNING id`,
      [status, task.id],
    );
    response.json({ data: mapTask(await loadTaskRow(result.rows[0].id)) });
  } catch (error) {
    next(error);
  }
});

taskRouter.post('/:taskId/completion', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const taskId = requireUuid(request.params.taskId, 'taskId');
    const task = await assertTaskAccess(taskId, user.id);
    await requireProjectMember(task.project_id, user.id);
    if (task.assigned_to !== user.id) throw new AppError(403, 'FORBIDDEN', 'Only the assigned member can execute this task');
    const result = await getDatabase().query<{ id: string }>(
      `UPDATE tasks SET status = 'COMPLETED', completed_at = now(), updated_at = now() WHERE id = $1 RETURNING id`,
      [task.id],
    );
    response.json({ data: mapTask(await loadTaskRow(result.rows[0].id)) });
  } catch (error) {
    next(error);
  }
});

taskRouter.patch('/:taskId/assignment', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const taskId = requireUuid(request.params.taskId, 'taskId');
    const task = await assertTaskAccess(taskId, user.id);
    await requireProjectLeader(task.project_id, user);
    const body = requireBody(request.body);
    const assignedTo = optionalUuid(body.assignedTo, 'assignedTo');
    const deadline = optionalDateTime(body.deadline, 'deadline');
    const milestoneId = optionalUuid(body.milestoneId, 'milestoneId');
    if (assignedTo) await assertProjectMember(task.project_id, assignedTo);
    if (milestoneId) {
      const milestone = await getDatabase().query('SELECT 1 FROM milestones WHERE id = $1 AND project_id = $2', [milestoneId, task.project_id]);
      if (!milestone.rows[0]) throw new AppError(422, 'INVALID_MILESTONE', 'The milestone does not belong to this project');
    }
    const result = await getDatabase().query<{ id: string }>(
      `UPDATE tasks SET assigned_to = $1, deadline = $2, milestone_id = $3, updated_at = now() WHERE id = $4 RETURNING id`,
      [assignedTo, deadline, milestoneId, taskId],
    );
    response.json({ data: mapTask(await loadTaskRow(result.rows[0].id)) });
  } catch (error) {
    next(error);
  }
});
