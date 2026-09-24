import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export function setAuthToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete apiClient.defaults.headers.common.Authorization;
}

export function getStoredToken(): string | null {
  return localStorage.getItem('nexora_token');
}

export function attachTokenFromStorage(): void {
  setAuthToken(getStoredToken());
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ error?: { message?: string; code?: string } }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message ?? error.message ?? 'Request failed';
    const code = error.response?.data?.error?.code;
    return Promise.reject(new ApiError(message, status, code));
  },
);

export async function request<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  const response = await apiClient.request<T>({ url: path, ...config });
  return response.data?.data ?? response.data ?? ({} as T);
}

export async function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: 'GET' });
}

export async function post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: 'POST', data });
}

export async function patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: 'PATCH', data });
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${baseURL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? payload?.message ?? 'Request failed', response.status, payload?.error?.code);
  }

  return (payload?.data ?? payload) as T;
}

attachTokenFromStorage();
