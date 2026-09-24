import { Router } from 'express';
import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import { getRequestUser, requireAuth, requireRole } from './middleware/auth-middleware.js';

export const milestoneRouter = Router();
milestoneRouter.use(requireAuth);

async function assertMember(projectId: string, userId: string): Promise<void> {
  const result = await getDatabase().query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
  if (result.rowCount !== 1) throw new AppError(403, 'FORBIDDEN', 'You are not a member of this project');
}

milestoneRouter.get('/project/:projectId', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    await assertMember(request.params.projectId, user.id);
    const result = await getDatabase().query(
      `SELECT m.id, m.project_id, m.name, m.description, m.start_date, m.deadline, m.status,
              COUNT(t.id)::int AS total_tasks,
              COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED')::int AS completed_tasks
       FROM milestones m LEFT JOIN tasks t ON t.milestone_id = m.id
       WHERE m.project_id = $1 GROUP BY m.id ORDER BY m.deadline NULLS LAST, m.created_at DESC`,
      [request.params.projectId]
    );
    response.json({ data: result.rows.map(milestone => ({ ...milestone, completion: milestone.total_tasks === 0 ? 0 : Math.round(milestone.completed_tasks / milestone.total_tasks * 10000) / 100 })) });
  } catch (error) {
    next(error);
  }
});

milestoneRouter.post('/', requireRole('PROFESSOR', 'TEAM_LEADER'), async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const { projectId, name, description = '', startDate = null, deadline = null } = request.body ?? {};
    if (typeof projectId !== 'string' || typeof name !== 'string' || name.trim().length < 2) throw new AppError(422, 'VALIDATION_ERROR', 'projectId and milestone name are required');
    await assertMember(projectId, user.id);
    const result = await getDatabase().query(
      `INSERT INTO milestones (project_id, name, description, start_date, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, project_id, name, description, start_date, deadline, status, created_at, updated_at`,
      [projectId, name.trim(), description, startDate, deadline]
    );
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

milestoneRouter.put('/:milestoneId', requireRole('PROFESSOR', 'TEAM_LEADER'), async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const { name, description = '', startDate = null, deadline = null, status = 'PLANNING' } = request.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2 || !['PLANNING', 'ACTIVE', 'COMPLETED'].includes(status)) throw new AppError(422, 'VALIDATION_ERROR', 'Milestone data is invalid');
    const result = await getDatabase().query(
      `UPDATE milestones m SET name = $1, description = $2, start_date = $3, deadline = $4, status = $5, updated_at = now()
       WHERE m.id = $6 AND EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = m.project_id AND pm.user_id = $7)
       RETURNING m.id, m.project_id, m.name, m.description, m.start_date, m.deadline, m.status, m.updated_at`,
      [name.trim(), description, startDate, deadline, status, request.params.milestoneId, user.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone was not found');
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

milestoneRouter.delete('/:milestoneId', requireRole('PROFESSOR', 'TEAM_LEADER'), async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const result = await getDatabase().query(
      `DELETE FROM milestones m WHERE m.id = $1 AND EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = m.project_id AND pm.user_id = $2) RETURNING m.id`,
      [request.params.milestoneId, user.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone was not found');
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
