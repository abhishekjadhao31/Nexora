import { Router } from 'express';
import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import { getRequestUser, requireAuth, requireRole } from './middleware/auth-middleware.js';
import { mapProject, mapProjectMember } from './dtos.js';
import { requireProjectLeader, requireProjectViewer } from './project-access.js';
import { enumValue, optionalDate, optionalString, projectRoles, projectStatuses, requireBody, requireString, requireUuid, requiredEnumValue, validateDateRange } from './validation.js';

export const projectRouter = Router();
projectRouter.use(requireAuth);

projectRouter.get('/', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const result = await getDatabase().query(
      `SELECT p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.created_by, p.created_at, p.updated_at
       FROM projects p
       WHERE EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $1)
         OR EXISTS (SELECT 1 FROM project_supervisors ps WHERE ps.project_id = p.id AND ps.supervisor_id = $1)
       ORDER BY p.updated_at DESC`,
      [user.id]
    );
    response.setHeader('Cache-Control', 'private, max-age=60');
    response.json({ data: result.rows.map(mapProject) });
  } catch (error) {
    next(error);
  }
});

projectRouter.post('/', requireRole('PROFESSOR', 'TEAM_LEADER', 'STUDENT'), async (request, response, next) => {
  const database = getDatabase();
  try {
    const user = getRequestUser(request);
    const body = requireBody(request.body);
    const name = requireString(body.name, 'name', 2, 150);
    const description = optionalString(body.description, 'description', 5000);
    const status = enumValue(body.status, 'status', projectStatuses, 'PLANNING');
    const startDate = optionalDate(body.startDate, 'startDate');
    const endDate = optionalDate(body.endDate, 'endDate');
    validateDateRange(startDate, endDate);
    const creatorRole = requiredEnumValue(body.creatorRole, 'creatorRole', projectRoles);
    const rawMembers = body.members === undefined ? [] : body.members;
    if (!Array.isArray(rawMembers)) throw new AppError(422, 'VALIDATION_ERROR', 'members must be an array');
    const requestedMembers = rawMembers.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new AppError(422, 'VALIDATION_ERROR', `members[${index}] must be an object`);
      const member = entry as Record<string, unknown>;
      return {
        userId: requireUuid(member.userId, `members[${index}].userId`),
        projectRole: requiredEnumValue(member.projectRole, `members[${index}].projectRole`, projectRoles),
      };
    });
    const memberIds = requestedMembers.map((member) => member.userId);
    if (new Set(memberIds).size !== memberIds.length) throw new AppError(422, 'VALIDATION_ERROR', 'Duplicate project members are not allowed');
    if (memberIds.includes(user.id)) throw new AppError(422, 'DUPLICATE_CREATOR_MEMBERSHIP', 'Do not include the creator in members; use creatorRole instead');
    const memberships = [{ userId: user.id, projectRole: creatorRole }, ...requestedMembers];
    if (!memberships.some((member) => member.projectRole === 'LEADER')) throw new AppError(422, 'LEADER_REQUIRED', 'A project must have at least one leader');
    const client = await database.connect();
    try {
      const targetIds = [...new Set(memberships.map((member) => member.userId))];
      const users = await client.query<{ id: string; role: string }>('SELECT id, role FROM users WHERE id = ANY($1::uuid[])', [targetIds]);
      if (users.rowCount !== targetIds.length) throw new AppError(404, 'USER_NOT_FOUND', 'One or more selected users do not exist');
      await client.query('BEGIN');
      const project = await client.query(
        `INSERT INTO projects (name, description, status, start_date, end_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, status, start_date, end_date, created_by, created_at, updated_at`,
        [name.trim(), description, status, startDate, endDate, user.id]
      );
      for (const member of memberships) {
        await client.query(
          'INSERT INTO project_members (project_id, user_id, project_role) VALUES ($1, $2, $3)',
          [project.rows[0].id, member.userId, member.projectRole],
        );
      }
      await client.query('COMMIT');
      response.status(201).json({ data: mapProject(project.rows[0]) });
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

projectRouter.get('/:projectId', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = requireUuid(request.params.projectId, 'projectId');
    await requireProjectViewer(projectId, user);
    const database = getDatabase();
    const projectResult = await database.query(
      `SELECT p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.created_by, p.created_at, p.updated_at,
              ps.supervisor_id
       FROM projects p LEFT JOIN project_supervisors ps ON ps.project_id = p.id WHERE p.id = $1`,
      [projectId],
    );
    if (!projectResult.rows[0]) throw new Error('Project was not found');
    const members = await database.query(
      `SELECT u.id, u.name, u.email, u.role, pm.project_role
       FROM project_members pm JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 ORDER BY pm.project_role ASC, u.name ASC`,
      [projectId],
    );
    response.json({ data: { ...mapProject(projectResult.rows[0]), supervisorId: projectResult.rows[0].supervisor_id ?? null, members: members.rows.map(mapProjectMember) } });
  } catch (error) {
    next(error);
  }
});

projectRouter.get('/:projectId/members', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = requireUuid(request.params.projectId, 'projectId');
    await requireProjectViewer(projectId, user);
    const result = await getDatabase().query(
      `SELECT u.id, u.name, u.email, u.role, pm.project_role
       FROM project_members pm JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 ORDER BY pm.project_role ASC, u.name ASC`,
      [projectId],
    );
    response.json({ data: result.rows.map(mapProjectMember) });
  } catch (error) {
    next(error);
  }
});

projectRouter.post('/:projectId/members', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = requireUuid(request.params.projectId, 'projectId');
    await requireProjectLeader(projectId, user);
    const body = requireBody(request.body);
    const userId = requireUuid(body.userId, 'userId');
    const projectRole = enumValue(body.projectRole, 'projectRole', projectRoles, 'MEMBER');
    const database = getDatabase();
    const target = await database.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
    if (!target.rows[0]) throw new AppError(404, 'USER_NOT_FOUND', 'The selected user was not found');
    const result = await database.query(
      `INSERT INTO project_members (project_id, user_id, project_role) VALUES ($1, $2, $3)
       RETURNING project_id, user_id, project_role`,
      [projectId, userId, projectRole],
    );
    response.status(201).json({ data: { id: target.rows[0].id, name: target.rows[0].name, email: target.rows[0].email, role: target.rows[0].role, projectRole: result.rows[0].project_role } });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      next(new AppError(409, 'MEMBERSHIP_ALREADY_EXISTS', 'The user is already a member of this project'));
      return;
    }
    next(error);
  }
});

projectRouter.patch('/:projectId/members/:userId', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = requireUuid(request.params.projectId, 'projectId');
    const userId = requireUuid(request.params.userId, 'userId');
    await requireProjectLeader(projectId, user);
    const body = requireBody(request.body);
    const projectRole = enumValue(body.projectRole, 'projectRole', projectRoles, 'MEMBER');
    if (userId === user.id && projectRole !== 'LEADER') throw new AppError(403, 'FORBIDDEN', 'A project leader cannot demote themselves');
    if (projectRole === 'MEMBER') {
      const leaders = await getDatabase().query('SELECT COUNT(*)::int AS count FROM project_members WHERE project_id = $1 AND project_role = $2', [projectId, 'LEADER']);
      const current = await getDatabase().query('SELECT project_role FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
      if (current.rows[0]?.project_role === 'LEADER' && Number(leaders.rows[0].count) <= 1) throw new AppError(422, 'LAST_LEADER', 'A project must retain at least one leader');
    }
    const result = await getDatabase().query('UPDATE project_members SET project_role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING project_role', [projectRole, projectId, userId]);
    if (!result.rows[0]) throw new AppError(404, 'MEMBERSHIP_NOT_FOUND', 'The project membership was not found');
    response.json({ data: { projectId, userId, projectRole: result.rows[0].project_role } });
  } catch (error) {
    next(error);
  }
});

projectRouter.delete('/:projectId/members/:userId', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = requireUuid(request.params.projectId, 'projectId');
    const userId = requireUuid(request.params.userId, 'userId');
    await requireProjectLeader(projectId, user);
    const membership = await getDatabase().query('SELECT project_role FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
    if (!membership.rows[0]) throw new AppError(404, 'MEMBERSHIP_NOT_FOUND', 'The project membership was not found');
    if (membership.rows[0].project_role === 'LEADER') {
      const leaders = await getDatabase().query('SELECT COUNT(*)::int AS count FROM project_members WHERE project_id = $1 AND project_role = $2', [projectId, 'LEADER']);
      if (Number(leaders.rows[0].count) <= 1) throw new AppError(422, 'LAST_LEADER', 'A project must retain at least one leader');
    }
    await getDatabase().query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

projectRouter.get('/:projectId/progress', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const projectId = requireUuid(request.params.projectId, 'projectId');
    await requireProjectViewer(projectId, user);
    const result = await getDatabase().query(
      `SELECT COUNT(t.id)::int AS total_tasks,
              COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED')::int AS completed_tasks
       FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id
       WHERE t.project_id = $1 AND pm.user_id = $2`,
      [projectId, user.id]
    );
    const counts = result.rows[0];
    const progress = counts.total_tasks === 0 ? 0 : Math.round((counts.completed_tasks / counts.total_tasks) * 10000) / 100;
    response.json({ data: { projectId, totalTasks: counts.total_tasks, completedTasks: counts.completed_tasks, progress } });
  } catch (error) {
    next(error);
  }
});
