import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError, apiClient, request, setAuthToken } from './client';

function responseAdapter(data: unknown) {
  return async (config: InternalAxiosRequestConfig) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

describe('shared API client', () => {
  let capturedConfig: InternalAxiosRequestConfig | undefined;

  beforeEach(() => {
    setAuthToken(null);
    capturedConfig = undefined;
    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config;
      return responseAdapter({ data: { ok: true } })(config);
    };
  });

  it('adds the bearer token and correlation ID, then unwraps API data', async () => {
    setAuthToken('jwt-token');
    const result = await request<{ ok: boolean }>('/health');
    expect(result).toEqual({ ok: true });
    expect(capturedConfig?.headers.Authorization).toBe('Bearer jwt-token');
    expect(capturedConfig?.headers['X-Correlation-ID']).toEqual(expect.any(String));
  });

  it('normalizes structured API errors', async () => {
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Request failed with status code 403',
        'ERR_BAD_RESPONSE',
        config,
        undefined,
        {
          data: { error: { message: 'Access denied', code: 'FORBIDDEN', correlationId: 'corr-1' } },
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config,
        },
      );
    };

    await expect(request('/protected')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Access denied',
      status: 403,
      code: 'FORBIDDEN',
      correlationId: 'corr-1',
    } satisfies Partial<ApiError>);
  });

  it('does not clear authentication state for forbidden responses', async () => {
    setAuthToken('valid-jwt');
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('Forbidden', 'ERR_BAD_RESPONSE', config, undefined, {
        data: { error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      });
    };

    await expect(request('/restricted')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(localStorage.getItem('nexora_token')).toBe('valid-jwt');
  });
});