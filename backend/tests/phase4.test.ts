import request from 'supertest';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

const queryMock = jest.fn();
const clientQueryMock = jest.fn();
const client = { query: clientQueryMock, release: jest.fn() };
const connectMock = jest.fn(async () => client);

jest.unstable_mockModule('../src/database.js', () => ({
  getDatabase: () => ({ query: queryMock, connect: connectMock }),
}));

const { app } = await import('../src/app.js');
const { issueToken } = await import('../src/auth.js');

const leader = { id: '11111111-1111-4111-8111-111111111111', name: 'Leader', email: 'leader@example.com', role: 'TEAM_LEADER' as const };
const member = { id: '22222222-2222-4222-8222-222222222222', name: 'Member', email: 'member@example.com', role: 'STUDENT' as const };
const professor = { id: '33333333-3333-4333-8333-333333333333', name: 'Professor', email: 'professor@example.com', role: 'PROFESSOR' as const };

beforeEach(() => {
  queryMock.mockReset();
  clientQueryMock.mockReset();
  connectMock.mockClear();
});

describe('Phase 4 project and directory APIs', () => {
  it('returns safe user search results and supports exact UUID lookup', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [leader], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [member], rowCount: 1 });
    const response = await request(app)
      .get('/api/v1/users?search=member')
      .set('Authorization', `Bearer ${issueToken(leader)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([member]);
    expect(response.body.data[0].password_hash).toBeUndefined();
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('lower(name) LIKE'), [null, '%member%', 20, leader.id]);

    queryMock
      .mockResolvedValueOnce({ rows: [leader], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [member], rowCount: 1 });
    const exact = await request(app)
      .get(`/api/v1/users?search=${member.id}`)
      .set('Authorization', `Bearer ${issueToken(leader)}`);
    expect(exact.status).toBe(200);
  });

  it('creates a project and memberships atomically with explicit roles', async () => {
    queryMock.mockResolvedValueOnce({ rows: [leader], rowCount: 1 });
    clientQueryMock
      .mockResolvedValueOnce({ rows: [leader, member], rowCount: 2 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: '44444444-4444-4444-8444-444444444444', name: 'Project', description: '', status: 'PLANNING', start_date: null, end_date: null, created_by: leader.id, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' }], rowCount: 1 })
      .mockResolvedValue({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${issueToken(leader)}`)
      .send({ name: 'Project', creatorRole: 'LEADER', members: [{ userId: member.id, projectRole: 'MEMBER' }] });

    expect(response.status).toBe(201);
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('BEGIN'));
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('project_role'), ['44444444-4444-4444-8444-444444444444', leader.id, 'LEADER']);
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('project_role'), ['44444444-4444-4444-8444-444444444444', member.id, 'MEMBER']);
    expect(clientQueryMock).not.toHaveBeenCalledWith(expect.stringContaining('project_supervisors'), expect.anything());
    expect(clientQueryMock).toHaveBeenCalledWith('COMMIT');
  });

  it('allows a student creator to choose MEMBER when another selected user is LEADER', async () => {
    queryMock.mockResolvedValueOnce({ rows: [member], rowCount: 1 });
    clientQueryMock
      .mockResolvedValueOnce({ rows: [member, leader], rowCount: 2 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: '88888888-8888-4888-8888-888888888888', name: 'Student Project', description: '', status: 'ACTIVE', start_date: null, end_date: null, created_by: member.id, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' }], rowCount: 1 })
      .mockResolvedValue({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${issueToken(member)}`)
      .send({ name: 'Student Project', creatorRole: 'MEMBER', members: [{ userId: leader.id, projectRole: 'LEADER' }] });

    expect(response.status).toBe(201);
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('project_role'), ['88888888-8888-4888-8888-888888888888', member.id, 'MEMBER']);
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('project_role'), ['88888888-8888-4888-8888-888888888888', leader.id, 'LEADER']);
  });

  it('creates a project without a supervisor when none is selected', async () => {
    queryMock.mockResolvedValueOnce({ rows: [leader], rowCount: 1 });
    clientQueryMock
      .mockResolvedValueOnce({ rows: [leader], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: '99999999-9999-4999-8999-999999999999', name: 'No Supervisor Project', description: '', status: 'ACTIVE', start_date: null, end_date: null, created_by: leader.id, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' }], rowCount: 1 })
      .mockResolvedValue({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${issueToken(leader)}`)
      .send({ name: 'No Supervisor Project', creatorRole: 'LEADER', members: [] });

    expect(response.status).toBe(201);
    expect(clientQueryMock).not.toHaveBeenCalledWith(expect.stringContaining('project_supervisors'), expect.anything());
  });

  it('rolls back when membership insertion fails', async () => {
    queryMock.mockResolvedValueOnce({ rows: [leader], rowCount: 1 });
    clientQueryMock
      .mockResolvedValueOnce({ rows: [leader, member], rowCount: 2 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: '55555555-5555-4555-8555-555555555555', name: 'Project', description: '', status: 'PLANNING', start_date: null, end_date: null, created_by: leader.id, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' }], rowCount: 1 })
      .mockRejectedValueOnce(new Error('membership failure'))
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${issueToken(leader)}`)
      .send({ name: 'Project', creatorRole: 'LEADER', members: [{ userId: member.id, projectRole: 'MEMBER' }] });

    expect(response.status).toBe(500);
    expect(clientQueryMock).toHaveBeenCalledWith('ROLLBACK');
    expect(clientQueryMock).not.toHaveBeenCalledWith('COMMIT');
  });

  it('allows a project leader to assign a task only to a project member', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [leader], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ project_role: 'LEADER' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ project_role: 'MEMBER' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: '66666666-6666-4666-8666-666666666666' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: '66666666-6666-4666-8666-666666666666', project_id: '77777777-7777-4777-8777-777777777777', title: 'Build UI', description: '', assigned_to: member.id, created_by: leader.id, status: 'TO_DO', priority: 'HIGH', deadline: '2026-11-01T17:00:00.000Z', milestone_id: null, project_name: 'Project', assignee_name: member.name, assignee_email: member.email, milestone_name: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z', completed_at: null }], rowCount: 1 });

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${issueToken(leader)}`)
      .send({ projectId: '77777777-7777-4777-8777-777777777777', title: 'Build UI', assignedTo: member.id, priority: 'HIGH', deadline: '2026-11-01T17:00:00.000Z' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ projectId: '77777777-7777-4777-8777-777777777777', assignedTo: member.id, deadline: '2026-11-01T17:00:00.000Z' });
  });

  it('allows a global student who is a project leader to create a task', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [member], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ project_role: 'LEADER' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', project_id: '77777777-7777-4777-8777-777777777777', title: 'Student leader task', description: '', assigned_to: null, created_by: member.id, status: 'TO_DO', priority: 'MEDIUM', deadline: null, milestone_id: null, project_name: 'Project', assignee_name: null, assignee_email: null, milestone_name: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z', completed_at: null }], rowCount: 1 });

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${issueToken(member)}`)
      .send({ projectId: '77777777-7777-4777-8777-777777777777', title: 'Student leader task' });

    expect(response.status).toBe(201);
    expect(response.body.data.createdBy).toBe(member.id);
  });

  it('rejects a global team leader who is only a project member', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [leader], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ project_role: 'MEMBER' }], rowCount: 1 });

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${issueToken(leader)}`)
      .send({ projectId: '77777777-7777-4777-8777-777777777777', title: 'Build UI' });

    expect(response.status).toBe(403);
    expect(queryMock).toHaveBeenCalledTimes(2);
  });
});