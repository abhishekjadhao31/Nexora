import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors.js';

const buckets = new Map<string, { startedAt: number; count: number }>();
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const maxRequests = Number(process.env.RATE_LIMIT_MAX ?? 100);

export function rateLimit(request: Request, _response: Response, next: NextFunction): void {
  const key = request.ip ?? 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
    next();
    return;
  }
  bucket.count += 1;
  if (bucket.count > maxRequests) {
    next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests; try again later'));
    return;
  }
  next();
}