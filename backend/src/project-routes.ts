import { Router } from 'express';
import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import { getRequestUser, requireAuth, requireRole } from './middleware/auth-middleware.js';

export const projectRouter = Router();
projectRouter.use(requireAuth);

projectRouter.get('/', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const result = await getDatabase().query(
      `SELECT p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.created_at, p.updated_at
       FROM projects p JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1 ORDER BY p.updated_at DESC`,
      [user.id]
    );
    response.setHeader('Cache-Control', 'private, max-age=60');
    response.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

projectRouter.post('/', requireRole('PROFESSOR', 'TEAM_LEADER'), async (request, response, next) => {
  const database = getDatabase();
  try {
    const user = getRequestUser(request);
    const { name, description = '', status = 'PLANNING', startDate = null, endDate = null } = request.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2) throw new AppError(422, 'VALIDATION_ERROR', 'Project name must contain at least two characters');
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      const project = await client.query(
        `INSERT INTO projects (name, description, status, start_date, end_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, status, start_date, end_date, created_at, updated_at`,
        [name.trim(), description, status, startDate, endDate, user.id]
      );
      await client.query(
        'INSERT INTO project_members (project_id, user_id, project_role) VALUES ($1, $2, $3)',
        [project.rows[0].id, user.id, user.role]
      );
      await client.query('COMMIT');
      response.status(201).json({ data: project.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

projectRouter.get('/:projectId/progress', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const result = await getDatabase().query(
      `SELECT COUNT(t.id)::int AS total_tasks,
              COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED')::int AS completed_tasks
       FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id
       WHERE t.project_id = $1 AND pm.user_id = $2`,
      [request.params.projectId, user.id]
    );
    const counts = result.rows[0];
    const progress = counts.total_tasks === 0 ? 0 : Math.round((counts.completed_tasks / counts.total_tasks) * 10000) / 100;
    response.json({ data: { projectId: request.params.projectId, totalTasks: counts.total_tasks, completedTasks: counts.completed_tasks, progress } });
  } catch (error) {
    next(error);
  }
});
