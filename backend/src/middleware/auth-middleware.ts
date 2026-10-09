import type { NextFunction, Request, Response } from 'express';
import { authenticateToken, type AuthUser, type Role } from '../auth.js';
import { AppError } from '../errors.js';

type AuthenticatedRequest = Request & { user?: AuthUser };

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  try {
    (request as AuthenticatedRequest).user = authenticateToken(request.header('authorization'));
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const user = (request as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission for this operation'));
      return;
    }
    next();
  };
}

export function getRequestUser(request: Request): AuthUser {
  const user = (request as AuthenticatedRequest).user;
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required');
  return user;
}
