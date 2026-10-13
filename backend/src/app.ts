import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { config } from './config.js';
import { AppError } from './errors.js';
import { authRouter } from './auth-routes.js';
import { projectRouter } from './project-routes.js';
import { taskRouter } from './task-routes.js';
import { milestoneRouter } from './milestone-routes.js';
import { notificationRouter } from './notification-routes.js';
import { evaluationRouter } from './evaluation-routes.js';
import { rateLimit } from './middleware/rate-limit.js';
import { graphqlMiddleware } from './graphql.js';
import { userRouter } from './user-routes.js';

export const app = express();
const require = createRequire(import.meta.url);
const pinoHttp = require('pino-http') as (options?: Record<string, unknown>) => express.RequestHandler;
const logger = pino();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
app.use(rateLimit);
app.use((request, response, next) => {
  const correlationId = request.header('X-Correlation-ID') ?? randomUUID();
  response.setHeader('X-Correlation-ID', correlationId);
  next();
});
app.use(pinoHttp({ logger, redact: ['req.headers.authorization', 'req.headers.cookie'] }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/milestones', milestoneRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/evaluations', evaluationRouter);
app.use('/api/v1/users', userRouter);
app.use('/graphql', graphqlMiddleware);

const openApiPath = resolve(process.cwd(), '../docs/openapi.yaml');
const openApiDocument = YAML.parse(readFileSync(openApiPath, 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'nexora-api' });
});

app.get('/api/v1/health', (_request, response) => {
  response.json({ data: { status: 'ok' } });
});

const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  logger.error({ err: error }, 'Unhandled request error');
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'The request body must contain valid JSON',
        status: 400,
        correlationId: response.getHeader('X-Correlation-ID')
      }
    });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        status: error.status,
        correlationId: response.getHeader('X-Correlation-ID')
      }
    });
    return;
  }
  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
      correlationId: response.getHeader('X-Correlation-ID')
    }
  });
};

app.use(errorHandler);
