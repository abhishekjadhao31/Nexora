import { AppError } from './errors.js';
import type { MilestoneStatus, ProjectStatus, TaskPriority, TaskStatus } from './dtos.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function requireBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(422, 'VALIDATION_ERROR', 'A JSON object request body is required');
  }
  return body as Record<string, unknown>;
}

export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} must be a valid UUID`);
  }
  return value;
}

export function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requireUuid(value, field);
}

export function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} must use YYYY-MM-DD format`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} is not a valid date`);
  }
  return value;
}

export function optionalDateTime(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} must be a valid date-time`);
  }
  return new Date(value).toISOString();
}

export function requireString(value: unknown, field: string, minLength: number, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length < minLength || value.trim().length > maxLength) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} must contain between ${minLength} and ${maxLength} characters`);
  }
  return value.trim();
}

export function optionalString(value: unknown, field: string, maxLength: number, defaultValue = ''): string {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} must not exceed ${maxLength} characters`);
  }
  return value.trim();
}

export function enumValue<T extends string>(value: unknown, field: string, allowed: readonly T[], defaultValue: T): T {
  const candidate = value === undefined || value === null ? defaultValue : value;
  if (typeof candidate !== 'string' || !allowed.includes(candidate as T)) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} is not supported`);
  }
  return candidate as T;
}

export function requiredEnumValue<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} is not supported`);
  }
  return value as T;
}

export function validateDateRange(startDate: string | null, endDate: string | null): void {
  if (startDate && endDate && startDate > endDate) {
    throw new AppError(422, 'VALIDATION_ERROR', 'The start date cannot be after the end date');
  }
}

export const projectStatuses: readonly ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];
export const taskStatuses: readonly TaskStatus[] = ['TO_DO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
export const taskPriorities: readonly TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const milestoneStatuses: readonly MilestoneStatus[] = ['PLANNING', 'ACTIVE', 'COMPLETED'];
export const projectRoles = ['LEADER', 'MEMBER'] as const;
