import { mapEvaluation, mapMilestone, mapNotification, mapProject, mapTask } from '../src/dtos.js';
import { optionalDate, requireUuid, requiredEnumValue } from '../src/validation.js';

describe('API DTO mapping and validation', () => {
  it('maps project database fields to camelCase', () => {
    const result = mapProject({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'NEXORA',
      description: 'Workspace',
      status: 'ACTIVE',
      start_date: '2026-01-01',
      end_date: '2026-02-01',
      created_by: '22222222-2222-4222-8222-222222222222',
      created_at: new Date('2026-01-01T10:00:00.000Z'),
      updated_at: new Date('2026-01-02T10:00:00.000Z'),
      password_hash: 'never-return-this',
    });

    expect(result).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'NEXORA',
      description: 'Workspace',
      status: 'ACTIVE',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      createdBy: '22222222-2222-4222-8222-222222222222',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-02T10:00:00.000Z',
    });
    expect(result).not.toHaveProperty('password_hash');
  });

  it('maps task, milestone, notification, and evaluation fields', () => {
    expect(mapTask({
      id: '11111111-1111-4111-8111-111111111111', project_id: '22222222-2222-4222-8222-222222222222',
      title: 'Task', description: '', assigned_to: null, created_by: '33333333-3333-4333-8333-333333333333',
      status: 'TO_DO', priority: 'HIGH', deadline: new Date('2026-01-03T00:00:00.000Z'), milestone_id: null,
      created_at: new Date('2026-01-01T00:00:00.000Z'), updated_at: new Date('2026-01-02T00:00:00.000Z'), completed_at: null,
    })).toMatchObject({ projectId: '22222222-2222-4222-8222-222222222222', assignedTo: null, createdBy: '33333333-3333-4333-8333-333333333333' });

    expect(mapMilestone({ id: '1', project_id: '2', name: 'M', description: '', start_date: '2026-01-01', deadline: null, status: 'PLANNING', total_tasks: 4, completed_tasks: 3 })).toMatchObject({ projectId: '2', totalTasks: 4, completedTasks: 3, completion: 75 });
    expect(mapNotification({ id: '1', title: 'T', message: 'M', read_at: null, created_at: new Date('2026-01-01T00:00:00.000Z') })).toEqual({ id: '1', title: 'T', message: 'M', readAt: null, createdAt: '2026-01-01T00:00:00.000Z' });
    expect(mapEvaluation({ id: '1', project_id: '2', student_id: '3', professor_id: '4', score: '8.5', comments: '', created_at: '2026-01-01T00:00:00.000Z' })).toMatchObject({ projectId: '2', studentId: '3', professorId: '4', score: 8.5, createdAt: '2026-01-01T00:00:00.000Z' });
  });

  it('rejects malformed UUIDs, invalid dates, and unsupported enums', () => {
    expect(() => requireUuid('not-a-uuid', 'projectId')).toThrow('projectId must be a valid UUID');
    expect(() => optionalDate('2026-02-30', 'startDate')).toThrow('startDate is not a valid date');
    expect(() => requiredEnumValue('UNKNOWN', 'status', ['TO_DO'] as const)).toThrow('status is not supported');
  });
});
