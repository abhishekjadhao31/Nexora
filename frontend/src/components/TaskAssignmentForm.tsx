import { useState, type FormEvent } from 'react';
import type { Milestone, ProjectMember, Task } from '../api/types';
import { createTask } from '../services/tasks';

type Props = {
  projectId: string;
  members: ProjectMember[];
  milestones: Milestone[];
  onCreated: (task: Task) => void;
};

export function TaskAssignmentForm({ projectId, members, milestones, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [deadline, setDeadline] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 2) {
      setError('Task title must contain at least two characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const task = await createTask({
        projectId,
        title: title.trim(),
        description,
        assignedTo: assignedTo || null,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        milestoneId: milestoneId || null,
      });
      onCreated(task);
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority('MEDIUM');
      setDeadline('');
      setMilestoneId('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="sheet-form" onSubmit={submit}>
      <h3>Assign a task</h3>
      {error && <p className="form-error">{error}</p>}
      <label>Task title<input required minLength={2} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></label>
      <label>Team member
        <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
          <option value="">Unassigned</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.projectRole})</option>)}
        </select>
      </label>
      <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Task['priority'])}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
      <label>Timeline deadline<input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
      <label>Milestone
        <select value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)}>
          <option value="">No milestone</option>
          {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.name}</option>)}
        </select>
      </label>
      {members.length === 0 && <p className="empty-state">Add project members before assigning a task.</p>}
      <button className="primary-button compact" type="submit" disabled={saving}>{saving ? 'Assigning...' : 'Create and assign task'}</button>
    </form>
  );
}
