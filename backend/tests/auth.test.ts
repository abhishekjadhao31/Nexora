import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

const queryMock = jest.fn();
jest.unstable_mockModule('../src/database.js', () => ({
  getDatabase: () => ({ query: queryMock }),
}));

const { app } = await import('../src/app.js');
const { issueToken } = await import('../src/auth.js');

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Test Student',
  email: 'student@example.com',
  role: 'STUDENT' as const,
};

beforeEach(() => {
  queryMock.mockReset();
});

describe('authentication endpoints', () => {
  it('returns a safe error for malformed JSON bodies', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'MALFORMED_JSON', status: 400 });
    expect(response.body.error.stack).toBeUndefined();
  });

  it('registers a student and returns a safe DTO with a real JWT', async () => {
    queryMock.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const response = await request(app).post('/api/v1/auth/register').send({
      name: ' Test Student ',
      email: 'Student@Example.com',
      password: 'correct-password',
      role: 'STUDENT',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toEqual(user);
    expect(response.body.data.user.password_hash).toBeUndefined();
    expect(jwt.verify(response.body.data.token, 'test-secret')).toMatchObject({ id: user.id, role: 'STUDENT' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['Test Student', 'student@example.com', expect.any(String), 'STUDENT'],
    );
    expect(queryMock.mock.calls[0][1][2]).not.toBe('correct-password');
  });

  it('rejects public privileged-role assignment', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Unauthorized Professor',
      email: 'professor@example.com',
      password: 'correct-password',
      role: 'PROFESSOR',
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_ASSIGNMENT_NOT_ALLOWED');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('returns a conflict for a duplicate email', async () => {
    queryMock.mockRejectedValueOnce({ code: '23505' });

    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Existing Student',
      email: 'student@example.com',
      password: 'correct-password',
      role: 'STUDENT',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('logs in with a PostgreSQL password hash and rejects invalid credentials', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    queryMock.mockResolvedValueOnce({ rows: [{ ...user, password_hash: passwordHash }], rowCount: 1 });

    const success = await request(app).post('/api/v1/auth/login').send({
      email: ' Student@Example.com ',
      password: 'correct-password',
    });

    expect(success.status).toBe(200);
    expect(success.body.data.user).toEqual(user);
    expect(success.body.data.token).toBeTruthy();

    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const failure = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: 'wrong-password',
    });

    expect(failure.status).toBe(401);
    expect(failure.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('loads the current user from PostgreSQL for a valid JWT', async () => {
    queryMock.mockResolvedValueOnce({ rows: [user], rowCount: 1 });
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${issueToken(user)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(user);
    expect(queryMock).toHaveBeenCalledWith('SELECT id, name, email, role FROM users WHERE id = $1', [user.id]);
  });

  it('rejects missing, invalid, expired, and deleted-account tokens', async () => {
    const missing = await request(app).get('/api/v1/auth/me');
    expect(missing.status).toBe(401);

    const invalid = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid-token');
    expect(invalid.status).toBe(401);

    const expiredToken = jwt.sign(user, 'test-secret', { expiresIn: -1 });
    const expired = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${expiredToken}`);
    expect(expired.status).toBe(401);

    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const deleted = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${issueToken(user)}`);
    expect(deleted.status).toBe(401);
  });
});
