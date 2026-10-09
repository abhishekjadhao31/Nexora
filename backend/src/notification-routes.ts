import { Router } from 'express';
import { getDatabase } from './database.js';
import { AppError } from './errors.js';
import { getRequestUser, requireAuth } from './middleware/auth-middleware.js';

export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get('/', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const result = await getDatabase().query(
      `SELECT id, title, message, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [user.id]
    );
    response.setHeader('Cache-Control', 'private, max-age=15');
    response.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

notificationRouter.get('/:notificationId', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    const result = await getDatabase().query(
      'SELECT id, title, message, read_at, created_at FROM notifications WHERE id = $1 AND user_id = $2',
      [request.params.notificationId, user.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found');
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch('/:notificationId', async (request, response, next) => {
  try {
    const user = getRequestUser(request);
    if (request.body?.read !== true && request.body?.read !== false) throw new AppError(422, 'VALIDATION_ERROR', 'read must be a boolean');
    const result = await getDatabase().query(
      'UPDATE notifications SET read_at = CASE WHEN $1 THEN now() ELSE NULL END WHERE id = $2 AND user_id = $3 RETURNING id, title, message, read_at, created_at',
      [request.body.read, request.params.notificationId, user.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found');
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
