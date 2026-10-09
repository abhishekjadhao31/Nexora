import request from 'supertest';
import { app } from '../src/app.js';

describe('health endpoints', () => {
  it('returns service health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'nexora-api' });
    expect(response.headers['x-correlation-id']).toBeTruthy();
  });

  it('returns versioned API health', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
  });
});
