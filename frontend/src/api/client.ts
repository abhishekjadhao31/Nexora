import { githubStatus, notifications, projects, tasks, users } from './mockData';
import type { AppUser, Role } from './types';

type MockCredential = AppUser & {
  password: string;
};

const mockCredentialsKey = 'nexora_mock_credentials';

function getMockCredentials(): MockCredential[] {
  const stored = localStorage.getItem(mockCredentialsKey);
  if (stored) {
    try {
      return JSON.parse(stored) as MockCredential[];
    } catch {
      localStorage.removeItem(mockCredentialsKey);
    }
  }

  const seeded = users.map((user) => ({ ...user, password: 'password123' }));
  localStorage.setItem(mockCredentialsKey, JSON.stringify(seeded));
  return seeded;
}

function saveMockCredentials(credentials: MockCredential[]): void {
  localStorage.setItem(mockCredentialsKey, JSON.stringify(credentials));
}

function authenticateMockUser(path: string, options: RequestInit): { user: AppUser; token: string } | AppUser {
  const credentials = getMockCredentials();
  const body = options.body ? JSON.parse(String(options.body)) as Record<string, string> : {};

  if (path === '/auth/me') {
    const storedUser = localStorage.getItem('nexora_user');
    if (!storedUser) {
      throw new Error('No active session');
    }
    return JSON.parse(storedUser) as AppUser;
  }

  if (path === '/auth/login') {
    const email = body.email?.trim().toLowerCase();
    const account = credentials.find((candidate) => candidate.email.toLowerCase() === email && candidate.password === body.password);
    if (!account) {
      throw new Error('Invalid email or password');
    }

    const { password: _password, ...user } = account;
    return { user, token: `mock-token-${account.id}` };
  }

  const email = body.email?.trim().toLowerCase();
  if (!body.name?.trim() || !email || !body.password || !body.role) {
    throw new Error('Name, email, password, and role are required');
  }
  if (credentials.some((candidate) => candidate.email.toLowerCase() === email)) {
    throw new Error('An account with this email already exists');
  }

  const user: AppUser = {
    id: `u-${Date.now()}`,
    name: body.name.trim(),
    email,
    role: body.role as Role,
    department: 'New workspace',
    title: body.role === 'PROFESSOR' ? 'Supervisor' : body.role === 'TEAM_LEADER' ? 'Team Lead' : 'Student',
  };
  saveMockCredentials([...credentials, { ...user, password: body.password }]);
  return { user, token: `mock-token-${user.id}` };
}

const mockMap: Record<string, (options?: RequestInit) => unknown> = {
  '/auth/me': (options = {}) => authenticateMockUser('/auth/me', options),
  '/auth/login': (options = {}) => authenticateMockUser('/auth/login', options),
  '/auth/register': (options = {}) => authenticateMockUser('/auth/register', options),
  '/projects': () => projects,
  '/notifications': () => notifications,
  '/github/status': () => githubStatus,
  '/github/repositories': () => githubStatus.repositories,
  '/github/contributions': () => ({
    commits: 18,
    pullRequests: 5,
    mergedPullRequests: 3,
    filesChanged: 32,
    additions: 430,
    deletions: 54,
    timeline: [
      { id: 'c-1', time: '09:20', title: 'Branch created', detail: 'feature/NEX-42-jwt-auth' },
      { id: 'c-2', time: '10:15', title: 'Commit pushed', detail: 'NEX-42 Add JWT middleware' },
      { id: 'c-3', time: '12:40', title: 'Pull request opened', detail: '#57 NEX-42 Implement JWT Authentication' },
      { id: 'c-4', time: '16:10', title: 'PR merged', detail: 'Merged by Abhishek Patel' }
    ]
  }),
  '/reports': () => [
    { id: 'r-1', title: 'Sprint progress report', progress: 72, completedTasks: 15, overdueTasks: 2, activeMembers: 8, summary: 'Strong progress across the current sprint.', generatedAt: '2026-09-23T08:00:00Z' }
  ],
  '/users': () => users,
  '/tasks': () => tasks,
  '/evaluations': () => [{ id: 'ev-1', projectId: 'p-1', memberId: 'u-2', memberName: 'Priya Raman', taskCompletion: 92, timeliness: 88, codeQuality: 94, teamContribution: 90, communication: 89, comments: 'Excellent work', status: 'SUBMITTED', submittedAt: '2026-09-21T12:00:00Z' }]
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const fallback = mockMap[path];
  if (fallback) {
    return fallback(options) as T;
  }

  const token = localStorage.getItem('nexora_token');
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  }).catch(() => null as Response | null);

  if (response && response.ok) {
    const body = await response.json().catch(() => ({}));
    return (body?.data ?? body) as T;
  }

  if (response && !response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message ?? body?.message ?? 'Request failed';
    throw new Error(message);
  }

  throw new Error('The backend is not available in this environment right now.');
}

export function setStoredUser(user: unknown): void {
  localStorage.setItem('nexora_user', JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem('nexora_user');
  localStorage.removeItem('nexora_token');
}
