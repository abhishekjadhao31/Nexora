import type { Role } from './auth.js';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MilestoneStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED';

export type ProjectDto = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMemberDto[];
  supervisorId?: string | null;
};

export type TaskDto = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string | null;
  createdBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assigneeName?: string;
  assigneeEmail?: string;
  projectName?: string;
  milestoneName?: string;
};

export type MilestoneDto = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string | null;
  deadline: string | null;
  status: MilestoneStatus;
  totalTasks: number;
  completedTasks: number;
  completion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationDto = {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type EvaluationDto = {
  id: string;
  projectId: string;
  studentId: string;
  professorId: string;
  score: number;
  comments: string;
  createdAt: string;
  studentName?: string;
  professorName?: string;
};

export function mapProject(row: Record<string, unknown>): ProjectDto {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    status: row.status as ProjectStatus,
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    ...(row.created_by ? { createdBy: String(row.created_by) } : {}),
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
  };
}

export function mapTask(row: Record<string, unknown>): TaskDto {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    description: String(row.description ?? ''),
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    createdBy: String(row.created_by),
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    deadline: row.deadline ? new Date(String(row.deadline)).toISOString() : null,
    ...(row.assignee_name ? { assigneeName: String(row.assignee_name) } : {}),
    ...(row.assignee_email ? { assigneeEmail: String(row.assignee_email) } : {}),
    ...(row.project_name ? { projectName: String(row.project_name) } : {}),
    ...(row.milestone_name ? { milestoneName: String(row.milestone_name) } : {}),
    milestoneId: row.milestone_id ? String(row.milestone_id) : null,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
    completedAt: row.completed_at ? formatTimestamp(row.completed_at) : null,
  };
}

export function mapMilestone(row: Record<string, unknown>): MilestoneDto {
  const totalTasks = Number(row.total_tasks ?? 0);
  const completedTasks = Number(row.completed_tasks ?? 0);
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    description: String(row.description ?? ''),
    startDate: formatDate(row.start_date),
    deadline: formatDate(row.deadline),
    status: row.status as MilestoneStatus,
    totalTasks,
    completedTasks,
    completion: totalTasks === 0 ? 0 : Math.round(completedTasks / totalTasks * 10000) / 100,
    ...(row.created_at ? { createdAt: formatTimestamp(row.created_at) } : {}),
    ...(row.updated_at ? { updatedAt: formatTimestamp(row.updated_at) } : {}),
  };
}

export function mapNotification(row: Record<string, unknown>): NotificationDto {
  return {
    id: String(row.id),
    title: String(row.title),
    message: String(row.message),
    readAt: row.read_at ? formatTimestamp(row.read_at) : null,
    createdAt: formatTimestamp(row.created_at),
  };
}

export function mapEvaluation(row: Record<string, unknown>): EvaluationDto {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    studentId: String(row.student_id),
    professorId: String(row.professor_id),
    score: Number(row.score),
    comments: String(row.comments ?? ''),
    createdAt: formatTimestamp(row.created_at),
    ...(row.student_name ? { studentName: String(row.student_name) } : {}),
    ...(row.professor_name ? { professorName: String(row.professor_name) } : {}),
  };
}

export type ProjectMemberDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
  projectRole: 'LEADER' | 'MEMBER';
};

function formatTimestamp(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function formatDate(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

export function mapProjectMember(row: Record<string, unknown>): ProjectMemberDto {
  return {
    id: String(row.id ?? row.user_id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as Role,
    projectRole: row.project_role as 'LEADER' | 'MEMBER',
  };
}
