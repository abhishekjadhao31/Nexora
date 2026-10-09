import { Router } from 'express';
import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import { getRequestUser, requireAuth, requireRole } from './middleware/auth-middleware.js';

export const evaluationRouter = Router();
evaluationRouter.use(requireAuth);

async function assertProjectMember(projectId: string, userId: string): Promise<void> {
  const result = await getDatabase().query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
  if (result.rowCount !== 1) throw new AppError(403, 'FORBIDDEN', 'You are not a member of this project');
}

evaluationRouter.get('/project/:projectId', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = String(request.params.projectId);
    await assertProjectMember(projectId, user.id);
    const result = await getDatabase().query(
      `SELECT e.id, e.project_id, e.student_id, e.professor_id, e.score, e.comments, e.created_at,
              student.name AS student_name, professor.name AS professor_name
       FROM evaluations e JOIN users student ON student.id = e.student_id JOIN users professor ON professor.id = e.professor_id
       WHERE e.project_id = $1 ORDER BY e.created_at DESC`,
      [request.params.projectId]
    );
    response.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

evaluationRouter.post('/project/:projectId', requireRole('PROFESSOR'), async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = String(request.params.projectId);
    const { studentId, score, comments = '' } = request.body ?? {};
    if (typeof studentId !== 'string' || typeof score !== 'number' || score < 0 || score > 10) throw new AppError(422, 'VALIDATION_ERROR', 'studentId and a score between 0 and 10 are required');
    await assertProjectMember(projectId, user.id);
    const result = await getDatabase().query(
      `INSERT INTO evaluations (project_id, student_id, professor_id, score, comments)
       SELECT $1, $2, $3, $4, $5 WHERE EXISTS (SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2)
       ON CONFLICT (project_id, student_id, professor_id) DO UPDATE SET score = EXCLUDED.score, comments = EXCLUDED.comments, created_at = now()
       RETURNING id, project_id, student_id, professor_id, score, comments, created_at`,
      [projectId, studentId, user.id, score, comments]
    );
    if (!result.rows[0]) throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student is not a member of this project');
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
