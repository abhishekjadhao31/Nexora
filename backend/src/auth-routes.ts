import { Router } from 'express';
import { authenticateToken, issueToken, loginUser, registerUser, validateLogin, validateRegister } from './auth.js';

export const authRouter = Router();

authRouter.post('/register', async (request, response, next) => {
  try {
    validateRegister(request.body);
    const user = await registerUser(request.body);
    response.status(201).json({ data: { user, token: issueToken(user) } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    validateLogin(request.body);
    response.json({ data: await loginUser(request.body) });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', (request, response, next) => {
  try {
    response.json({ data: authenticateToken(request.header('authorization')) });
  } catch (error) {
    next(error);
  }
});
