export type Role = 'STUDENT' | 'TEAM_LEADER' | 'PROFESSOR';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  department?: string;
  title?: string;
  githubUsername?: string;
  githubConnected?: boolean;
};

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  repository?: string;
  ownerId?: string;
  ownerName?: string;
  members?: ProjectMember[];
  totalTasks?: number;
  completedTasks?: number;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Task = {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assigneeName?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deadline?: string;
  completedAt?: string;
  githubBranch?: string;
  linkedPr?: string;
  linkedCommits?: number;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
  type?: string;
  actionUrl?: string;
};

export type ActivityItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
};

export type GitHubStatus = {
  connected: boolean;
  username?: string;
  owner?: string;
  repository?: string;
  repositories?: Array<{ id: string; name: string; fullName: string; defaultBranch: string; private?: boolean }>;
  recentCommits?: number;
  pullRequests?: number;
  mergedPullRequests?: number;
  lastSyncedAt?: string;
};

export type Evaluation = {
  id: string;
  projectId: string;
  memberId: string;
  memberName: string;
  taskCompletion: number;
  timeliness: number;
  codeQuality: number;
  teamContribution: number;
  communication: number;
  comments: string;
  status: 'DRAFT' | 'SUBMITTED';
  submittedAt?: string;
};

export type Report = {
  id: string;
  title: string;
  progress: number;
  completedTasks: number;
  overdueTasks: number;
  activeMembers: number;
  summary: string;
  generatedAt: string;
};

export type UserSummary = {
  id: string;
  name: string;
  role: Role;
  assignedTasks: number;
  completedTasks: number;
  completionRate: number;
  commits: number;
  pullRequests: number;
  mergedPullRequests: number;
  lastActivity: string;
};
