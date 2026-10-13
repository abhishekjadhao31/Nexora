import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';
const authTokenKey = 'nexora_token';

type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
    correlationId?: string;
  };
  message?: string;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  correlationId?: string;

  constructor(message: string, status?: number, code?: string, correlationId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
  }
}

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export function getStoredToken(): string | null {
  return localStorage.getItem(authTokenKey);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(authTokenKey, token);
    return;
  }
  localStorage.removeItem(authTokenKey);
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

apiClient.interceptors.request.use((request) => {
  const token = getStoredToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  if (!request.headers['X-Correlation-ID']) {
    request.headers['X-Correlation-ID'] = crypto.randomUUID();
  }
  return request;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('nexora:unauthorized'));
      }
    }
    const body = error.response?.data;
    const details = body?.error;
    const message = details?.message ?? body?.message ?? error.message ?? 'Request failed';
    throw new ApiError(
      message,
      error.response?.status,
      details?.code,
      details?.correlationId ?? error.response?.headers['x-correlation-id'],
    );
  },
);

export async function request<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  const response = await apiClient.request<T | { data?: T }>({ url: path, ...config });
  const payload = response.data;
  return (typeof payload === 'object' && payload !== null && 'data' in payload ? payload.data : payload) as T;
}

export function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: 'GET' });
}

export function post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: 'POST', data });
}

export function patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: 'PATCH', data });
}

export function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { method = 'GET', headers, body } = options;
  return request<T>(path, {
    method,
    headers: headers as AxiosRequestConfig['headers'],
    data: typeof body === 'string' ? JSON.parse(body) : body,
  });
}
