import type { AppUser, Evaluation, GitHubStatus, Notification, Project, Report, Task, UserSummary } from '../api/types';

export const users: AppUser[] = [
  { id: 'u-1', name: 'Abhishek Patel', email: 'abhishek@nexora.dev', role: 'PROFESSOR', department: 'Software Engineering', title: 'Supervisor', githubUsername: 'abhishek', githubConnected: true },
  { id: 'u-2', name: 'Priya Raman', email: 'priya@nexora.dev', role: 'STUDENT', department: 'Computer Science', title: 'Frontend Engineer', githubUsername: 'priyaraman', githubConnected: true },
  { id: 'u-3', name: 'Rahul Kumar', email: 'rahul@nexora.dev', role: 'STUDENT', department: 'Computer Science', title: 'Backend Engineer', githubUsername: 'rahulk', githubConnected: true },
  { id: 'u-4', name: 'Maya Nair', email: 'maya@nexora.dev', role: 'TEAM_LEADER', department: 'Product', title: 'Team Lead', githubUsername: 'maya', githubConnected: true },
  { id: 'u-5', name: 'Leo Grant', email: 'leo@nexora.dev', role: 'STUDENT', department: 'Data Science', title: 'Research Analyst', githubUsername: 'leogrant', githubConnected: false },
];

export const projectMembers = {
  'p-1': [users[1], users[2], users[4]],
  'p-2': [users[1], users[3], users[2]],
  'p-3': [users[2], users[4], users[3]],
};

export const projects: Project[] = [
  { id: 'p-1', name: 'NEXORA Platform', description: 'Project visibility and contribution evidence for academic software teams.', status: 'ACTIVE', ownerId: 'u-1', ownerName: 'Abhishek Patel', repository: 'nexora/web-services', startDate: '2026-02-01', deadline: '2026-10-30', members: projectMembers['p-1'], totalTasks: 8, completedTasks: 5, progress: 72 },
  { id: 'p-2', name: 'Smart LabOps', description: 'Operations dashboard for lab equipment tracking and maintenance scheduling.', status: 'PLANNING', ownerId: 'u-4', ownerName: 'Maya Nair', repository: 'smart-labops/dashboard', startDate: '2026-03-10', deadline: '2026-11-22', members: projectMembers['p-2'], totalTasks: 6, completedTasks: 2, progress: 38 },
  { id: 'p-3', name: 'Civic Insights', description: 'Monitoring trends and communication for policy and civic engagement workflows.', status: 'ON_HOLD', ownerId: 'u-1', ownerName: 'Abhishek Patel', repository: 'civic-insights/portal', startDate: '2026-01-15', deadline: '2026-09-17', members: projectMembers['p-3'], totalTasks: 5, completedTasks: 2, progress: 46 },
];

export const tasks: Task[] = [
  { id: 't-101', projectId: 'p-1', projectName: 'NEXORA Platform', title: 'Implement JWT Authentication', description: 'Add secure token issuance and refresh flow for project workspaces.', status: 'COMPLETED', priority: 'HIGH', assignedTo: 'u-2', assigneeName: 'Priya Raman', createdAt: '2026-08-10', updatedAt: '2026-08-26', deadline: '2026-08-28', completedAt: '2026-08-26', githubBranch: 'feature/NEX-42-jwt-auth', linkedPr: '#57', linkedCommits: 4, filesChanged: 12, additions: 214, deletions: 31 },
  { id: 't-102', projectId: 'p-1', projectName: 'NEXORA Platform', title: 'Build project progress dashboard', description: 'Create status cards and metrics for project progress summaries.', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: 'u-3', assigneeName: 'Rahul Kumar', createdAt: '2026-08-18', updatedAt: '2026-08-22', deadline: '2026-09-10', githubBranch: 'feature/NEX-58-progress-panel', linkedPr: '#61', linkedCommits: 2, filesChanged: 7, additions: 92, deletions: 16 },
  { id: 't-103', projectId: 'p-1', projectName: 'NEXORA Platform', title: 'Review Handoff documentation', description: 'Validate onboarding notes and final system handoff.', status: 'BLOCKED', priority: 'MEDIUM', assignedTo: 'u-5', assigneeName: 'Leo Grant', createdAt: '2026-08-20', updatedAt: '2026-08-29', deadline: '2026-09-05', githubBranch: 'docs/NEX-63-handoff', linkedCommits: 0 },
  { id: 't-201', projectId: 'p-2', projectName: 'Smart LabOps', title: 'Set up maintenance schedules', description: 'Capture equipment maintenance workflows and status tracking.', status: 'TO_DO', priority: 'MEDIUM', assignedTo: 'u-4', assigneeName: 'Maya Nair', createdAt: '2026-08-13', updatedAt: '2026-08-13', deadline: '2026-09-15' },
  { id: 't-301', projectId: 'p-3', projectName: 'Civic Insights', title: 'Prepare issue summary feed', description: 'Collect civic issue summaries and signal classification.', status: 'IN_PROGRESS', priority: 'LOW', assignedTo: 'u-2', assigneeName: 'Priya Raman', createdAt: '2026-07-27', updatedAt: '2026-08-21', deadline: '2026-09-20' },
];

export const notifications: Notification[] = [
  { id: 'n-1', title: 'Task assigned', message: 'You were assigned to Implement JWT Authentication.', createdAt: '2026-09-23T09:15:00Z', type: 'TASK_ASSIGNED', actionUrl: '/tasks/t-101', readAt: null },
  { id: 'n-2', title: 'Pull request updated', message: 'NEX-42 Implement JWT Authentication is ready for review.', createdAt: '2026-09-22T18:40:00Z', type: 'GITHUB_PR', actionUrl: '/projects/p-1?tab=github', readAt: '2026-09-22T19:05:00Z' },
  { id: 'n-3', title: 'Evaluation submitted', message: 'Your supervisor submitted an evaluation for the current milestone.', createdAt: '2026-09-20T15:05:00Z', type: 'EVALUATION_SUBMITTED', actionUrl: '/supervisor/evaluations/ev-1', readAt: null },
  { id: 'n-4', title: 'Deadline reminder', message: 'The NEXORA Platform progress dashboard is due in 2 days.', createdAt: '2026-09-19T12:00:00Z', type: 'DEADLINE_REMINDER', actionUrl: '/tasks/t-102', readAt: '2026-09-19T12:12:00Z' },
];

export const githubStatus: GitHubStatus = {
  connected: true,
  username: 'priyaraman',
  owner: 'nexora',
  repository: 'web-services',
  repositories: [
    { id: 'gh-1', name: 'web-services', fullName: 'nexora/web-services', defaultBranch: 'main' },
    { id: 'gh-2', name: 'dashboard', fullName: 'smart-labops/dashboard', defaultBranch: 'main' },
  ],
  recentCommits: 18,
  pullRequests: 5,
  mergedPullRequests: 3,
  lastSyncedAt: '2026-09-23T09:00:00Z',
};

export const evaluations: Evaluation[] = [
  { id: 'ev-1', projectId: 'p-1', memberId: 'u-2', memberName: 'Priya Raman', taskCompletion: 92, timeliness: 88, codeQuality: 94, teamContribution: 90, communication: 89, comments: 'Strong implementation progress and consistent GitHub activity across the sprint.', status: 'SUBMITTED', submittedAt: '2026-09-21T12:00:00Z' },
  { id: 'ev-2', projectId: 'p-2', memberId: 'u-3', memberName: 'Rahul Kumar', taskCompletion: 78, timeliness: 72, codeQuality: 81, teamContribution: 83, communication: 86, comments: 'Solid backend delivery with minor delay on documentation tasks.', status: 'DRAFT' },
];

export const reports: Report[] = [
  { id: 'r-1', title: 'Sprint progress report', progress: 72, completedTasks: 15, overdueTasks: 2, activeMembers: 8, summary: 'The platform remains on track with strong contributions from the frontend and backend teams.', generatedAt: '2026-09-23T08:00:00Z' },
  { id: 'r-2', title: 'Evaluation summary', progress: 81, completedTasks: 19, overdueTasks: 1, activeMembers: 6, summary: 'Most members are meeting deadlines and GitHub contribution evidence remains healthy.', generatedAt: '2026-09-18T08:00:00Z' },
];

export const memberSummaries: UserSummary[] = [
  { id: 'u-2', name: 'Priya Raman', role: 'STUDENT', assignedTasks: 6, completedTasks: 5, completionRate: 83, commits: 18, pullRequests: 4, mergedPullRequests: 3, lastActivity: '2026-09-23' },
  { id: 'u-3', name: 'Rahul Kumar', role: 'STUDENT', assignedTasks: 5, completedTasks: 3, completionRate: 60, commits: 14, pullRequests: 2, mergedPullRequests: 1, lastActivity: '2026-09-22' },
  { id: 'u-5', name: 'Leo Grant', role: 'STUDENT', assignedTasks: 4, completedTasks: 2, completionRate: 50, commits: 6, pullRequests: 1, mergedPullRequests: 0, lastActivity: '2026-09-20' },
];
