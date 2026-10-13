import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberPicker } from './components/MemberPicker';
import { TaskAssignmentForm } from './components/TaskAssignmentForm';
import type { ProjectMember } from './api/types';
import { searchUsers } from './services/users';
import { createTask } from './services/tasks';

vi.mock('./services/users', () => ({ searchUsers: vi.fn() }));
vi.mock('./services/tasks', () => ({ createTask: vi.fn() }));

const member = { id: '11111111-1111-4111-8111-111111111111', name: 'Member One', email: 'member@example.com', role: 'STUDENT' as const };
const selected: ProjectMember[] = [{ ...member, projectRole: 'MEMBER' }];

beforeEach(() => {
  vi.mocked(searchUsers).mockReset();
  vi.mocked(createTask).mockReset();
});

describe('Phase 4 project and task controls', () => {
  it('searches registered users, selects one, changes role, and removes it', async () => {
    vi.mocked(searchUsers).mockResolvedValue([member]);
    let members: ProjectMember[] = [];
    const { rerender } = render(<MemberPicker selected={members} onChange={(next) => { members = next; }} currentUserId="current-user-id" />);
    fireEvent.change(screen.getByLabelText('Add project members'), { target: { value: 'member' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Member One')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(members).toHaveLength(1);
    rerender(<MemberPicker selected={members} onChange={(next) => { members = next; }} currentUserId="current-user-id" />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Project role for Member One' }), { target: { value: 'LEADER' } });
    expect(members[0].projectRole).toBe('LEADER');
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(members).toHaveLength(0);
  });

  it('submits a task assignment with a real member and timeline fields', async () => {
    vi.mocked(createTask).mockResolvedValue({ id: 'task-id', projectId: 'project-id', title: 'Build UI', description: '', assignedTo: member.id, createdBy: 'leader-id', status: 'TO_DO', priority: 'HIGH', deadline: '2026-11-01T17:00:00.000Z', milestoneId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', completedAt: null });
    render(<TaskAssignmentForm projectId="project-id" members={selected} milestones={[]} onCreated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'Build UI' } });
    fireEvent.change(screen.getByLabelText('Team member'), { target: { value: member.id } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'HIGH' } });
    fireEvent.change(screen.getByLabelText('Timeline deadline'), { target: { value: '2026-11-01T17:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create and assign task' }));
    await waitFor(() => expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project-id', assignedTo: member.id, priority: 'HIGH', milestoneId: null })));
  });
});
