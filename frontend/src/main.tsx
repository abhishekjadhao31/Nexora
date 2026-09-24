import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { apiRequest, clearStoredUser, setStoredUser } from './api/client';
import { memberSummaries, notifications, projects, tasks, users } from './api/mockData';
import type { AppUser, Evaluation, GitHubStatus, Notification, Project, Report, Task } from './api/types';
import './styles.css';

type AuthMode = 'login' | 'register';

const roleLabels: Record<AppUser['role'], string> = {
  STUDENT: 'Student',
  TEAM_LEADER: 'Team lead',
  PROFESSOR: 'Supervisor',
};

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem('nexora_token');
      if (!token) {
        setUser(null);
        setReady(true);
        return;
      }

      try {
        const nextUser = await apiRequest<AppUser>('/auth/me');
        setUser(nextUser);
        setStoredUser(nextUser);
      } catch {
        clearStoredUser();
        setUser(null);
      } finally {
        setReady(true);
      }
    };

    void loadCurrentUser();
  }, []);

  if (!ready) {
    return <LoadingScreen message="Loading NEXORA workspace..." />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthScreen onAuthenticated={setUser} />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <AuthScreen onAuthenticated={setUser} mode="register" />} />

      <Route element={<ProtectedRoute user={user} />}>
        <Route element={<AppLayout user={user} onLogout={() => setUser(null)} />}>
          <Route path="/dashboard" element={<DashboardPage user={user} />} />
          <Route path="/projects" element={<ProjectsPage user={user} />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage user={user} />} />
          <Route path="/tasks" element={<TasksPage user={user} />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage user={user} />} />
          <Route path="/github" element={<GitHubPage user={user} />} />
          <Route path="/notifications" element={<NotificationsPage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />

          <Route element={<RoleRoute allowedRoles={['TEAM_LEADER', 'PROFESSOR']} user={user} />}>
            <Route path="/supervisor" element={<SupervisorDashboardPage user={user} />} />
            <Route path="/supervisor/members/:memberId" element={<SupervisorMemberPage user={user} />} />
            <Route path="/supervisor/evaluations" element={<SupervisorEvaluationPage user={user} />} />
            <Route path="/supervisor/evaluations/:evaluationId" element={<EvaluationDetailPage user={user} />} />
            <Route path="/supervisor/reports" element={<ReportsPage user={user} />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['PROFESSOR']} user={user} />}>
            <Route path="/admin" element={<AdminPage user={user} />} />
            <Route path="/admin/users" element={<AdminUsersPage user={user} />} />
            <Route path="/admin/projects" element={<AdminProjectsPage user={user} />} />
            <Route path="/admin/tasks" element={<AdminTasksPage user={user} />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

function ProtectedRoute({ user }: { user: AppUser | null }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RoleRoute({ user, allowedRoles }: { user: AppUser | null; allowedRoles: AppUser['role'][] }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function AuthScreen({ onAuthenticated, mode: initialMode = 'login' }: { onAuthenticated: (user: AppUser) => void; mode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState({
    name: '',
    email: 'priya@nexora.dev',
    password: 'password123',
    role: 'STUDENT' as AppUser['role'],
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const result = await apiRequest<{ user: AppUser; token: string }>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      localStorage.setItem('nexora_token', result.token);
      setStoredUser(result.user);
      onAuthenticated(result.user);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-brand">
        <p className="eyebrow">PROJECT OPERATIONS / CONTRIBUTION EVIDENCE</p>
        <h1>NEXORA</h1>
        <p className="lede">Make project work visible, organized, and easier to evaluate.</p>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div className="tabs" aria-label="Authentication mode selector">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
        </div>

        <h2>{mode === 'login' ? 'Welcome back' : 'Start a workspace'}</h2>

        {mode === 'register' && (
          <>
            <label>
              Name
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AppUser['role'] })}>
                <option value="STUDENT">Student</option>
                <option value="TEAM_LEADER">Team leader</option>
                <option value="PROFESSOR">Supervisor</option>
              </select>
            </label>
          </>
        )}

        <label>
          Email
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>

        <label>
          Password
          <input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Please wait...' : mode === 'login' ? 'Enter NEXORA' : 'Create account'}
        </button>
      </form>
    </main>
  );
}

function AppLayout({ user, onLogout }: { user: AppUser | null; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = useMemo(() => {
    const base = [
      { to: '/dashboard', label: 'Overview' },
      { to: '/projects', label: 'Projects' },
      { to: '/tasks', label: 'Tasks' },
      { to: '/github', label: 'GitHub' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/profile', label: 'Profile' },
    ];

    if (user?.role === 'PROFESSOR' || user?.role === 'TEAM_LEADER') {
      return [
        { to: '/dashboard', label: 'Overview' },
        { to: '/projects', label: 'Projects' },
        { to: '/supervisor', label: 'Supervisor' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/github', label: 'GitHub' },
        { to: '/notifications', label: 'Notifications' },
        { to: '/profile', label: 'Profile' },
      ];
    }

    return base;
  }, [user]);

  const handleLogout = () => {
    clearStoredUser();
    onLogout();
    navigate('/login');
  };

  return (
    <main className="workspace-shell">
      <header className="topbar">
        <div
          className="wordmark"
          onClick={() => navigate('/dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              navigate('/dashboard');
            }
          }}
        >
          NEXORA<span>/</span>
        </div>

        <div className="user-menu">
          <div className="user-summary">
            <span>{user?.name}</span>
            <small>{roleLabels[user?.role ?? 'STUDENT']}</small>
          </div>
          <button type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar">
          <p className="eyebrow">YOUR WORKSPACE</p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive || location.pathname === item.to ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'PROFESSOR' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Admin
            </NavLink>
          )}

          <a className="docs-link" href="http://localhost:4000/api-docs" target="_blank" rel="noreferrer">API documentation ↗</a>
        </aside>

        <section className="page-shell">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

function DashboardPage({ user }: { user: AppUser }) {
  const [projectData, setProjectData] = useState<Project[]>([]);
  const [taskData, setTaskData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [projectsResult, tasksResult] = await Promise.all([
          apiRequest<Project[]>('/projects'),
          apiRequest<Task[]>('/tasks'),
        ]);
        if (!active) return;
        setProjectData(projectsResult);
        setTaskData(tasksResult);
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard data');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const completedTasks = taskData.filter((task) => task.status === 'COMPLETED').length;
  const completion = taskData.length ? Math.round((completedTasks / taskData.length) * 100) : 0;

  return (
    <div className="page-content">
      <PageHeader
        eyebrow={user.role === 'STUDENT' ? 'MY CONTRIBUTION' : 'PROJECT OPERATIONS'}
        title={user.role === 'STUDENT' ? 'Good work starts with clarity.' : 'Project momentum in one view.'}
        action={user.role !== 'STUDENT' ? <button className="primary-button compact" type="button" onClick={() => navigate('/projects')}>+ New project</button> : undefined}
      />

      {error && <Alert message={error} />}

      {loading ? (
        <LoadingState label="Loading workspace..." />
      ) : (
        <>
          <div className="metric-grid">
            <StatCard label="Projects" value={String(projectData.length)} meta="active or assigned" />
            <StatCard label="Tasks" value={String(taskData.length)} meta={`${completedTasks} completed`} />
            <StatCard label="Completion" value={`${completion}%`} meta="current workload" tone="accent" />
          </div>

          <div className="content-columns">
            <Panel title="Active projects" subtitle="Portfolio overview" emptyText="No projects yet.">
              {projectData.length ? projectData.map((project) => (
                <button key={project.id} type="button" className="project-row" onClick={() => navigate(`/projects/${project.id}`)}>
                  <span className="project-mark">{project.name.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <strong>{project.name}</strong>
                    <small>{project.description}</small>
                  </span>
                  <b>{project.status}</b>
                </button>
              )) : null}
            </Panel>

            <Panel title="Task flow" subtitle="Priority queue" emptyText="No tasks assigned yet.">
              {taskData.length ? taskData.slice(0, 5).map((task) => (
                <button key={task.id} type="button" className="task-row" onClick={() => navigate(`/tasks/${task.id}`)}>
                  <span className={`task-state ${task.status === 'COMPLETED' ? 'completed' : task.status === 'BLOCKED' ? 'blocked' : ''}`} />
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.priority} / {task.status}</small>
                  </span>
                </button>
              )) : null}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectsPage({ user }: { user: AppUser }) {
  const [projectData, setProjectData] = useState<Project[]>([]);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      const data = await apiRequest<Project[]>('/projects');
      setProjectData(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const filtered = projectData.filter((project) =>
    project.name.toLowerCase().includes(query.toLowerCase()) ||
    project.description.toLowerCase().includes(query.toLowerCase()),
  );

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const name = String(new FormData(form).get('name') ?? '').trim();
    const description = String(new FormData(form).get('description') ?? '').trim();

    if (!name) {
      setError('Project name is required.');
      return;
    }

    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({ name, description, status: 'ACTIVE' }),
      });
      form.reset();
      setShowCreate(false);
      setError('');
      await loadProjects();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create project');
    }
  };

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="PROJECTS"
        title="Organized work across every initiative."
        action={<button className="primary-button compact" type="button" onClick={() => setShowCreate((value) => !value)}>+ Create project</button>}
      />

      {error && <Alert message={error} />}

      {showCreate && (
        <form className="sheet-form" onSubmit={createProject}>
          <div className="sheet-grid">
            <label>
              Project name
              <input name="name" required placeholder="NEXORA Partner Portal" />
            </label>
            <label>
              Repository
              <input name="repository" placeholder="owner/project" />
            </label>
            <label className="full-width">
              Description
              <textarea name="description" rows={3} placeholder="Describe the project, outcome, and collaboration goals." />
            </label>
            <label>
              Start date
              <input name="startDate" type="date" />
            </label>
            <label>
              Deadline
              <input name="deadline" type="date" />
            </label>
          </div>
          <div className="sheet-actions">
            <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="primary-button">Create project</button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" />
      </div>

      {loading ? (
        <LoadingState label="Loading projects..." />
      ) : (
        <div className="card-grid">
          {filtered.length ? filtered.map((project) => (
            <button key={project.id} type="button" className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="project-card-header">
                <div>
                  <p className="eyebrow">{project.status}</p>
                  <h3>{project.name}</h3>
                </div>
                <span className="badge muted">{project.progress ?? 0}%</span>
              </div>
              <p>{project.description}</p>
              <div className="list-two-col">
                <span>Owner</span><strong>{project.ownerName ?? 'NEXORA team'}</strong>
                <span>Members</span><strong>{project.members?.length ?? 0}</strong>
                <span>Tasks</span><strong>{project.totalTasks ?? 0}</strong>
                <span>Progress</span><strong>{project.progress ?? 0}%</strong>
              </div>
            </button>
          )) : <EmptyState message="No projects yet. Create a project to start collaborating." />}
        </div>
      )}
    </div>
  );
}

function ProjectDetailPage({ user }: { user: AppUser }) {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasksForProject, setTasksForProject] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') ?? 'overview';

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [projectList, tasksResult] = await Promise.all([
          apiRequest<Project[]>('/projects'),
          apiRequest<Task[]>('/tasks'),
        ]);

        if (!active) return;
        const nextProject = projectList.find((entry) => entry.id === projectId) ?? null;
        setProject(nextProject);
        setTasksForProject(tasksResult.filter((task) => task.projectId === projectId));
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load project details');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [projectId]);

  if (loading) return <LoadingState label="Loading project details..." />;
  if (!project) return <EmptyState message="Project not found." />;

  const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Tasks', value: 'tasks' },
    { label: 'Members', value: 'members' },
    { label: 'GitHub', value: 'github' },
    { label: 'Activity', value: 'activity' },
  ];

  return (
    <div className="page-content">
      <PageHeader eyebrow="PROJECT" title={project.name} action={<button className="secondary-button" type="button" onClick={() => navigate('/projects')}>← Back</button>} />

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button key={tab.value} type="button" className={activeTab === tab.value ? 'tab active' : 'tab'} onClick={() => setSearchParams({ tab: tab.value })}>{tab.label}</button>
        ))}
      </div>

      {error && <Alert message={error} />}

      {activeTab === 'overview' && (
        <div className="metric-grid">
          <StatCard label="Progress" value={`${project.progress ?? 0}%`} meta="overall" />
          <StatCard label="Tasks" value={String(tasksForProject.length)} meta={`${tasksForProject.filter((task) => task.status === 'COMPLETED').length} complete`} />
          <StatCard label="Members" value={String(project.members?.length ?? 0)} meta={project.ownerName ?? 'Owner'} />
        </div>
      )}

      {activeTab === 'tasks' && (
        <Panel title="Project tasks" subtitle="Milestone tracking" emptyText="No tasks for this project yet.">
          {tasksForProject.length ? tasksForProject.map((task) => (
            <button key={task.id} type="button" className="task-row" onClick={() => navigate(`/tasks/${task.id}`)}>
              <span className={`task-state ${task.status === 'COMPLETED' ? 'completed' : task.status === 'BLOCKED' ? 'blocked' : ''}`} />
              <span>
                <strong>{task.title}</strong>
                <small>{task.status} / {task.priority}</small>
              </span>
            </button>
          )) : null}
        </Panel>
      )}

      {activeTab === 'members' && (
        <Panel title="Project members" subtitle="Collaboration roster" emptyText="No members assigned yet.">
          {project.members?.length ? project.members.map((member) => (
            <button key={member.id} type="button" className="project-row" onClick={() => navigate(`/supervisor/members/${member.id}`)}>
              <span className="project-mark">{member.name.slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{member.name}</strong>
                <small>{member.role}</small>
              </span>
              <b>{member.email}</b>
            </button>
          )) : null}
        </Panel>
      )}

      {activeTab === 'github' && (
        <div className="detail-card">
          <h3>GitHub integration</h3>
          <p><strong>Repository:</strong> {project.repository ?? 'Not linked yet'}</p>
          <p><strong>Contribution status:</strong> {tasksForProject.some((task) => task.linkedPr) ? 'Active' : 'No linked PRs yet'}</p>
          <p><strong>Recent activity:</strong> {tasksForProject.filter((task) => (task.linkedCommits ?? 0) > 0).length} linked commits</p>
        </div>
      )}

      {activeTab === 'activity' && (
        <Panel title="Project activity" subtitle="Transparent updates" emptyText="No recent activity recorded yet.">
          <div className="timeline-list">
            <div className="timeline-item"><span>09:20</span><div><strong>Abhishek created task</strong><small>JWT Authentication</small></div></div>
            <div className="timeline-item"><span>10:15</span><div><strong>Task assigned</strong><small>Priya Raman</small></div></div>
            <div className="timeline-item"><span>12:30</span><div><strong>GitHub branch created</strong><small>feature/NEX-42-jwt-auth</small></div></div>
            <div className="timeline-item"><span>16:20</span><div><strong>PR merged</strong><small>#57 Implement JWT Authentication</small></div></div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function TasksPage({ user }: { user: AppUser }) {
  const [taskData, setTaskData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<Task[]>('/tasks');
        if (!active) return;
        setTaskData(data);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load tasks');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, []);

  const filtered = taskData.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || (task.projectName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'All' || task.status === status;
    const matchesPriority = priority === 'All' || task.priority === priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="page-content">
      <PageHeader eyebrow="TASKS" title="Track every task from assignment to delivery." />
      {error && <Alert message={error} />}

      <div className="toolbar">
        <input aria-label="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="All">All statuses</option>
          <option value="TO_DO">TO_DO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="All">All priorities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </div>

      {loading ? (
        <LoadingState label="Loading tasks..." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map((task) => (
                <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} className="table-row-link">
                  <td>{task.title}</td>
                  <td>{task.projectName ?? 'Project'}</td>
                  <td><span className="badge">{task.status}</span></td>
                  <td>{task.priority}</td>
                  <td>{task.assigneeName ?? 'Unassigned'}</td>
                  <td>{task.deadline ?? '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={6}><EmptyState message="No tasks match your current filters." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaskDetailPage({ user }: { user: AppUser }) {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const tasksResult = await apiRequest<Task[]>('/tasks');
        const selectedTask = tasksResult.find((entry) => entry.id === taskId) ?? null;
        if (!active) return;
        setTask(selectedTask);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load task details');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [taskId]);

  const updateStatus = async (status: Task['status']) => {
    if (!task) return;
    try {
      await apiRequest(`/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setTask({ ...task, status });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update task status');
    }
  };

  const completeTask = async () => {
    if (!task) return;
    try {
      await apiRequest(`/tasks/${task.id}/completion`, { method: 'POST' });
      setTask({ ...task, status: 'COMPLETED' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to mark task complete');
    }
  };

  if (loading) return <LoadingState label="Loading task details..." />;
  if (!task) return <EmptyState message="Task not found." />;

  return (
    <div className="page-content">
      <PageHeader eyebrow="TASK" title={task.title} action={<button className="secondary-button" type="button" onClick={() => navigate('/tasks')}>← Back</button>} />
      {error && <Alert message={error} />}

      <div className="detail-actions">
        <button type="button" className="primary-button compact" onClick={() => void completeTask()}>Mark complete</button>
        <button type="button" className="secondary-button compact" onClick={() => void updateStatus('IN_PROGRESS')}>Start work</button>
        <button type="button" className="secondary-button compact" onClick={() => void updateStatus('BLOCKED')}>Mark blocked</button>
      </div>

      <div className="detail-card">
        <p><strong>Project:</strong> {task.projectName ?? 'Not linked'}</p>
        <p><strong>Assignee:</strong> {task.assigneeName ?? 'Unassigned'}</p>
        <p><strong>Status:</strong> {task.status}</p>
        <p><strong>Priority:</strong> {task.priority}</p>
        <p><strong>Deadline:</strong> {task.deadline ?? 'Not set'}</p>
        <p><strong>Created:</strong> {task.createdAt ?? '—'}</p>
        <p><strong>Updated:</strong> {task.updatedAt ?? '—'}</p>
        <p><strong>Description:</strong> {task.description || 'No description added yet.'}</p>
      </div>

      <div className="detail-card github-card">
        <h3>GitHub activity</h3>
        <div className="list-two-col">
          <span>Repository</span><strong>{task.projectName ? 'nexora/web-services' : 'Not connected'}</strong>
          <span>Branch</span><strong>{task.githubBranch ?? 'feature/NEX-42-jwt-auth'}</strong>
          <span>Commits</span><strong>{task.linkedCommits ?? 4}</strong>
          <span>Pull request</span><strong>{task.linkedPr ?? '#57'}</strong>
          <span>Files changed</span><strong>{task.filesChanged ?? 12}</strong>
          <span>Additions</span><strong>{task.additions ?? 214}</strong>
          <span>Deletions</span><strong>{task.deletions ?? 31}</strong>
          <span>Last activity</span><strong>{task.updatedAt ?? '2026-09-23'}</strong>
        </div>
      </div>
    </div>
  );
}

function GitHubPage({ user }: { user: AppUser }) {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const github = await apiRequest<GitHubStatus>('/github/status');
        if (!active) return;
        setStatus(github);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load GitHub status');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState label="Loading GitHub contribution data..." />;

  return (
    <div className="page-content">
      <PageHeader eyebrow="GITHUB" title="Contribution evidence and project sync." />
      {error && <Alert message={error} />}

      <div className="detail-card">
        <h3>{status?.connected ? '✓ GitHub connected' : 'Connect GitHub to track your development contribution.'}</h3>
        <p><strong>Username:</strong> {status?.username ? `@${status.username}` : 'Not connected'}</p>
        <p><strong>Repository:</strong> {status?.owner && status?.repository ? `${status.owner}/${status.repository}` : 'Not linked'}</p>
        <div className="detail-actions">
          <button type="button" className="primary-button compact">Connect GitHub</button>
          <button type="button" className="secondary-button compact">Sync GitHub</button>
        </div>
      </div>

      <div className="metric-grid">
        <StatCard label="Recent commits" value={String(status?.recentCommits ?? 0)} meta="last 30 days" />
        <StatCard label="Pull requests" value={String(status?.pullRequests ?? 0)} meta="opened" />
        <StatCard label="Merged PRs" value={String(status?.mergedPullRequests ?? 0)} meta="accepted" />
      </div>
    </div>
  );
}

function NotificationsPage({ user }: { user: AppUser }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<Notification[]>('/notifications');
        setItems(data);
      } catch {
        setItems(notifications);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const markRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) });
      setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch {
      setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    }
  };

  const unread = items.filter((item) => !item.readAt).length;

  return (
    <div className="page-content">
      <PageHeader eyebrow="NOTIFICATIONS" title="Latest project updates." action={<button className="secondary-button compact" type="button">Mark all as read</button>} />
      <div className="detail-card compact-card"><strong>{unread}</strong> unread notifications</div>
      {loading ? <LoadingState label="Loading notifications..." /> : (
        <Panel title="Inbox" subtitle="All messages" emptyText="You are all caught up.">
          {items.length ? items.map((item) => (
            <div key={item.id} className="notification-item">
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
              <div className="notification-actions">
                {!item.readAt && <span className="badge">Unread</span>}
                <button type="button" className="secondary-button compact" onClick={() => void markRead(item.id)}>Mark read</button>
              </div>
            </div>
          )) : null}
        </Panel>
      )}
    </div>
  );
}

function ProfilePage({ user }: { user: AppUser }) {
  return (
    <div className="page-content">
      <PageHeader eyebrow="PROFILE" title={user.name} />
      <div className="detail-card">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {roleLabels[user.role]}</p>
        <p><strong>GitHub:</strong> {user.githubUsername ? `@${user.githubUsername}` : 'Not connected'}</p>
        <p><strong>Projects:</strong> {projects.length}</p>
        <p><strong>Activity:</strong> {tasks.length} tracked tasks</p>
      </div>
    </div>
  );
}

function SupervisorDashboardPage({ user }: { user: AppUser }) {
  const stats = useMemo(() => ({
    projects: projects.length,
    members: users.length,
    tasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === 'COMPLETED').length,
  }), []);

  const navigate = useNavigate();

  return (
    <div className="page-content">
      <PageHeader eyebrow="SUPERVISOR OVERVIEW" title="Team contribution at a glance." />
      <div className="metric-grid">
        <StatCard label="Total projects" value={String(stats.projects)} meta="active" />
        <StatCard label="Total members" value={String(stats.members)} meta="registered" />
        <StatCard label="Tasks" value={String(stats.tasks)} meta={`${stats.completedTasks} complete`} />
      </div>
      <Panel title="Member contribution" subtitle="Progress and evidence" emptyText="No contribution data yet.">
        {memberSummaries.map((member) => (
          <button key={member.id} type="button" className="project-row" onClick={() => navigate(`/supervisor/members/${member.id}`)}>
            <span className="project-mark">{member.name.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{member.name}</strong>
              <small>{member.completionRate}% completion</small>
            </span>
            <b>{member.commits} commits</b>
          </button>
        ))}
      </Panel>
    </div>
  );
}

function SupervisorMemberPage({ user }: { user: AppUser }) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const member = users.find((entry) => entry.id === memberId) ?? null;

  if (!member) return <EmptyState message="Member not found." />;

  return (
    <div className="page-content">
      <PageHeader eyebrow="MEMBER" title={member.name} action={<button className="secondary-button" type="button" onClick={() => navigate('/supervisor')}>← Back</button>} />
      <div className="detail-card">
        <p><strong>Role:</strong> {roleLabels[member.role]}</p>
        <p><strong>Projects:</strong> {projects.length}</p>
        <p><strong>Completed tasks:</strong> 5</p>
        <p><strong>Pending tasks:</strong> 2</p>
        <p><strong>GitHub contributions:</strong> 18 commits / 4 PRs</p>
      </div>
    </div>
  );
}

function SupervisorEvaluationPage({ user }: { user: AppUser }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    void apiRequest<Evaluation[]>('/evaluations').then(setEvaluations).catch(() => setEvaluations([]));
  }, []);

  return (
    <div className="page-content">
      <PageHeader eyebrow="EVALUATIONS" title="Member evidence and scoring." />
      <Panel title="Evaluation list" subtitle="Draft and submitted reviews" emptyText="No evaluations created yet.">
        {evaluations.length ? evaluations.map((evaluation) => (
          <button key={evaluation.id} type="button" className="project-row" onClick={() => navigate(`/supervisor/evaluations/${evaluation.id}`)}>
            <span className="project-mark">{evaluation.memberName.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{evaluation.memberName}</strong>
              <small>{evaluation.status}</small>
            </span>
            <b>{evaluation.taskCompletion}%</b>
          </button>
        )) : null}
      </Panel>
    </div>
  );
}

function EvaluationDetailPage({ user }: { user: AppUser }) {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState<Evaluation | null>(null);

  useEffect(() => {
    void apiRequest<Evaluation[]>('/evaluations').then((results) => {
      setDetails(results.find((entry) => entry.id === evaluationId) ?? null);
    }).catch(() => setDetails(null));
  }, [evaluationId]);

  if (!details) return <EmptyState message="Evaluation not found." />;

  return (
    <div className="page-content">
      <PageHeader eyebrow="EVALUATION" title={`${details.memberName} review`} action={<button className="secondary-button" type="button" onClick={() => navigate('/supervisor/evaluations')}>← Back</button>} />
      <div className="detail-card">
        <p><strong>Task completion:</strong> {details.taskCompletion}</p>
        <p><strong>Timeliness:</strong> {details.timeliness}</p>
        <p><strong>Code quality:</strong> {details.codeQuality}</p>
        <p><strong>Team contribution:</strong> {details.teamContribution}</p>
        <p><strong>Communication:</strong> {details.communication}</p>
        <p><strong>Comments:</strong> {details.comments}</p>
        <div className="detail-actions">
          <button type="button" className="secondary-button compact">Save draft</button>
          <button type="button" className="primary-button compact">Submit evaluation</button>
        </div>
      </div>
    </div>
  );
}

function ReportsPage({ user }: { user: AppUser }) {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    void apiRequest<Report[]>('/reports').then(setReports).catch(() => setReports([]));
  }, []);

  return (
    <div className="page-content">
      <PageHeader eyebrow="REPORTS" title="Progress and contribution snapshots." action={<button className="primary-button compact" type="button">Export report</button>} />
      <div className="card-grid">
        {reports.length ? reports.map((report) => (
          <div key={report.id} className="report-card">
            <h3>{report.title}</h3>
            <p>{report.summary}</p>
            <div className="list-two-col">
              <span>Progress</span><strong>{report.progress}%</strong>
              <span>Completed</span><strong>{report.completedTasks}</strong>
              <span>Overdue</span><strong>{report.overdueTasks}</strong>
              <span>Members</span><strong>{report.activeMembers}</strong>
            </div>
          </div>
        )) : <EmptyState message="No reports available yet." />}
      </div>
    </div>
  );
}

function AdminPage({ user }: { user: AppUser }) {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <PageHeader eyebrow="ADMIN" title="Operational controls and platform oversight." />
      <div className="card-grid">
        <button type="button" className="admin-card" onClick={() => navigate('/admin/users')}>Users</button>
        <button type="button" className="admin-card" onClick={() => navigate('/admin/projects')}>Projects</button>
        <button type="button" className="admin-card" onClick={() => navigate('/admin/tasks')}>Tasks</button>
      </div>
    </div>
  );
}

function AdminUsersPage({ user }: { user: AppUser }) {
  return (
    <div className="page-content">
      <PageHeader eyebrow="ADMIN / USERS" title="Manage people and roles." />
      <Panel title="Users" emptyText="No users available.">
        {users.map((entry) => (
          <div key={entry.id} className="project-row">
            <span className="project-mark">{entry.name.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{entry.name}</strong>
              <small>{entry.role}</small>
            </span>
            <b>{entry.email}</b>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function AdminProjectsPage({ user }: { user: AppUser }) {
  return (
    <div className="page-content">
      <PageHeader eyebrow="ADMIN / PROJECTS" title="Platform-wide project oversight." />
      <Panel title="Projects" emptyText="No projects available.">
        {projects.map((project) => (
          <div key={project.id} className="project-row">
            <span className="project-mark">{project.name.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{project.name}</strong>
              <small>{project.status}</small>
            </span>
            <b>{project.progress ?? 0}%</b>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function AdminTasksPage({ user }: { user: AppUser }) {
  return (
    <div className="page-content">
      <PageHeader eyebrow="ADMIN / TASKS" title="Cross-team execution overview." />
      <Panel title="Tasks" emptyText="No tasks available.">
        {tasks.map((task) => (
          <div key={task.id} className="task-row">
            <span className={`task-state ${task.status === 'COMPLETED' ? 'completed' : task.status === 'BLOCKED' ? 'blocked' : ''}`} />
            <span>
              <strong>{task.title}</strong>
              <small>{task.status} / {task.priority}</small>
            </span>
            <b>{task.assigneeName ?? 'Unassigned'}</b>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="dashboard-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}

function Panel({ title, subtitle, emptyText, children }: { title: string; subtitle?: string; emptyText?: string; children?: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow">{subtitle ?? 'SECTION'}</p>
        <h2>{title}</h2>
      </div>
      {children && children !== null ? children : <p className="empty-state">{emptyText ?? 'No items to display.'}</p>}
    </section>
  );
}

function StatCard({ label, value, meta, tone = 'default' }: { label: string; value: string; meta: string; tone?: 'default' | 'accent' }) {
  return (
    <div className={tone === 'accent' ? 'metric accent' : 'metric'}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return <div className="alert">{message}</div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="empty-state loading-state">{label}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="loading-shell">
      <div className="loading-box">
        <span className="status-dot" />
        <span>{message}</span>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
