import { Router } from 'express';
import { getDatabase } from './database.js';
import { getRequestUser, requireAuth } from './middleware/auth-middleware.js';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get('/', async (request, response, next) => {
  try {
    const currentUser = getRequestUser(request);
    const rawSearch = typeof request.query.search === 'string' ? request.query.search.trim() : '';
    const limit = Math.min(Math.max(Number(request.query.limit ?? 20), 1), 50);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawSearch);
    if (!isUuid && rawSearch.length < 2) {
      response.json({ data: [] });
      return;
    }
    const search = isUuid ? rawSearch : `%${rawSearch.toLowerCase()}%`;
    const result = await getDatabase().query(
      `SELECT id, name, email, role
       FROM users
      WHERE (id = $1::uuid OR lower(name) LIKE $2 OR lower(email) LIKE $2) AND id <> $4
       ORDER BY name ASC LIMIT $3`,
          [isUuid ? search : null, isUuid ? null : search, limit, currentUser.id],
    );
    response.json({ data: result.rows.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role })) });
  } catch (error) {
    next(error);
  }
});