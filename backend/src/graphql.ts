import { buildSchema, GraphQLError } from 'graphql';
import { graphqlHTTP } from 'express-graphql';
import { getDatabase } from './database.js';
import { authenticateToken, type AuthUser } from './auth.js';

const schema = buildSchema(`
  type Project { id: ID!, name: String!, description: String!, status: String! }
  type Task { id: ID!, title: String!, status: String!, priority: String!, deadline: String }
  type StudentContribution { projectId: ID!, studentId: ID!, assignedTasks: Int!, completedTasks: Int!, taskCompletion: Float! }
  type Query {
    projects: [Project!]!
    project(id: ID!): Project
    tasks(projectId: ID!): [Task!]!
    studentContribution(projectId: ID!, studentId: ID!): StudentContribution
  }
`);

async function requireUser(request: { headers: { authorization?: string } }): Promise<AuthUser> {
  return authenticateToken(request.headers.authorization);
}

const root = {
  projects: async (_args: unknown, context: { request: { headers: { authorization?: string } } }) => {
    const user = await requireUser(context.request);
    const result = await getDatabase().query(
      `SELECT p.id, p.name, p.description, p.status FROM projects p JOIN project_members pm ON pm.project_id = p.id WHERE pm.user_id = $1 ORDER BY p.updated_at DESC`,
      [user.id]
    );
    return result.rows;
  },
  project: async ({ id }: { id: string }, context: { request: { headers: { authorization?: string } } }) => {
    const user = await requireUser(context.request);
    const result = await getDatabase().query(
      `SELECT p.id, p.name, p.description, p.status FROM projects p JOIN project_members pm ON pm.project_id = p.id WHERE p.id = $1 AND pm.user_id = $2`,
      [id, user.id]
    );
    return result.rows[0] ?? null;
  },
  tasks: async ({ projectId }: { projectId: string }, context: { request: { headers: { authorization?: string } } }) => {
    const user = await requireUser(context.request);
    const result = await getDatabase().query(
      `SELECT t.id, t.title, t.status, t.priority, t.deadline FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id WHERE t.project_id = $1 AND pm.user_id = $2 ORDER BY t.deadline NULLS LAST`,
      [projectId, user.id]
    );
    return result.rows;
  },
  studentContribution: async ({ projectId, studentId }: { projectId: string; studentId: string }, context: { request: { headers: { authorization?: string } } }) => {
    const user = await requireUser(context.request);
    const membership = await getDatabase().query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, user.id]);
    if (membership.rowCount !== 1) throw new GraphQLError('You are not a member of this project');
    const result = await getDatabase().query(
      `SELECT COUNT(*)::int AS assigned_tasks, COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_tasks FROM tasks WHERE project_id = $1 AND assigned_to = $2`,
      [projectId, studentId]
    );
    const row = result.rows[0];
    return { projectId, studentId, assignedTasks: row.assigned_tasks, completedTasks: row.completed_tasks, taskCompletion: row.assigned_tasks === 0 ? 0 : Math.round(row.completed_tasks / row.assigned_tasks * 10000) / 100 };
  }
};

export const graphqlMiddleware = graphqlHTTP((request) => ({ schema, rootValue: root, graphiql: true, context: { request } }));