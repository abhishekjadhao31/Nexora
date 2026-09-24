import { githubStatus, notifications, projects, tasks, users } from './mockData';

const mockMap: Record<string, () => unknown> = {
  '/auth/me': () => {
    const stored = localStorage.getItem('nexora_user');
    if (stored) return JSON.parse(stored);
    return users[1];
  },
  '/auth/login': () => ({ user: users[1], token: 'mock-token-123' }),
  '/auth/register': () => ({ user: users[1], token: 'mock-token-123' }),
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
    return fallback() as T;
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
