import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRequire } from 'node:module';
import { AppError } from './errors.js';
import { getDatabase } from './database.js';

export type Role = 'PROFESSOR' | 'TEAM_LEADER' | 'STUDENT';
export type AuthUser = { id: string; name: string; email: string; role: Role };

type TokenPayload = AuthUser & { iat: number; exp: number };

const require = createRequire(import.meta.url);
type AjvConstructor = new (options?: { allErrors?: boolean }) => {
  compile: (schema: object) => (input: unknown) => boolean;
};
const AjvClass = require('ajv').default as AjvConstructor;
const ajv = new AjvClass({ allErrors: true });
const registerValidator = ajv.compile({
  type: 'object',
  required: ['name', 'email', 'password', 'role'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    email: { type: 'string', pattern: '^\\s*[^@\\s]+@[^@\\s]+\\.[^@\\s]+\\s*$', maxLength: 255 },
    password: { type: 'string', minLength: 8, maxLength: 128 },
    role: { enum: ['PROFESSOR', 'TEAM_LEADER', 'STUDENT'] }
  }
});

const loginValidator = ajv.compile({
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', pattern: '^\\s*[^@\\s]+@[^@\\s]+\\.[^@\\s]+\\s*$', maxLength: 255 },
    password: { type: 'string', minLength: 1, maxLength: 128 }
  }
});

function isRole(value: unknown): value is Role {
  return value === 'PROFESSOR' || value === 'TEAM_LEADER' || value === 'STUDENT';
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not configured');
  return value;
}

export function validateRegister(input: unknown): asserts input is { name: string; email: string; password: string; role: Role } {
  if (!registerValidator(input)) throw new AppError(422, 'VALIDATION_ERROR', 'Registration data is invalid');
  if ((input as { role: Role }).role !== 'STUDENT') throw new AppError(403, 'ROLE_ASSIGNMENT_NOT_ALLOWED', 'Public registration is limited to student accounts');
}

export function validateLogin(input: unknown): asserts input is { email: string; password: string } {
  if (!loginValidator(input)) throw new AppError(422, 'VALIDATION_ERROR', 'Login data is invalid');
}

export function issueToken(user: AuthUser): string {
  return jwt.sign(user, secret(), { expiresIn: '8h' });
}

export function authenticateToken(header: string | undefined): AuthUser {
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'UNAUTHORIZED', 'A bearer token is required');
  try {
    const payload = jwt.verify(header.slice(7), secret()) as TokenPayload;
    if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string' || typeof payload.name !== 'string' || typeof payload.email !== 'string' || !isRole(payload.role)) {
      throw new Error('Invalid token claims');
    }
    return { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'The access token is invalid or expired');
  }
}

export async function loadCurrentUser(userId: string): Promise<AuthUser> {
  const result = await getDatabase().query<AuthUser>(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [userId],
  );
  if (!result.rows[0]) throw new AppError(401, 'UNAUTHORIZED', 'The account is no longer available');
  return result.rows[0];
}

export async function registerUser(input: { name: string; email: string; password: string; role: Role }): Promise<AuthUser> {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const result = await getDatabase().query<AuthUser>(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [input.name.trim(), normalizeEmail(input.email), passwordHash, input.role]
    );
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
    throw error;
  }
}

export async function loginUser(input: { email: string; password: string }): Promise<{ user: AuthUser; token: string }> {
  const result = await getDatabase().query<AuthUser & { password_hash: string }>(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [normalizeEmail(input.email)]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  const publicUser: AuthUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return { user: publicUser, token: issueToken(publicUser) };
}
