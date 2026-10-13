import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from './main';
import { apiClient, setAuthToken } from './api/client';

const currentUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Test Student',
  email: 'student@example.com',
  role: 'STUDENT' as const,
};

function successAdapter(config: InternalAxiosRequestConfig) {
  const url = config.url ?? '';
  const data = url === '/auth/me'
    ? { data: currentUser }
    : url === '/auth/login'
      ? { data: { user: currentUser, token: 'real-test-jwt' } }
      : url.startsWith('/tasks')
        ? { data: [] }
        : { data: [] };
  return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
}

function unauthorizedAdapter(config: InternalAxiosRequestConfig) {
  return Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    data: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  }));
}

describe('frontend authentication flow', () => {
  beforeEach(() => {
    setAuthToken(null);
    apiClient.defaults.adapter = successAdapter;
  });

  afterEach(() => {
    cleanup();
    setAuthToken(null);
  });

  it('loads the current user and protects a dashboard route', async () => {
    setAuthToken('real-test-jwt');
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Test Student')).toBeTruthy());
    expect(screen.queryByText('Welcome back')).toBeNull();
  });

  it('redirects an unauthenticated dashboard visit to login', async () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);

    expect(await screen.findByText('Welcome back')).toBeTruthy();
  });

  it('logs in through the real auth response and reloads the current user', async () => {
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: currentUser.email } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter NEXORA' }));

    await waitFor(() => expect(screen.getByText('Test Student')).toBeTruthy());
    expect(localStorage.getItem('nexora_token')).toBe('real-test-jwt');
  });

  it('shows login failure without creating an authenticated session', async () => {
    apiClient.defaults.adapter = unauthorizedAdapter;
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: currentUser.email } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter NEXORA' }));

    expect(await screen.findByText('Unauthorized')).toBeTruthy();
    expect(localStorage.getItem('nexora_token')).toBeNull();
  });

  it('logs out and clears an expired authentication token', async () => {
    setAuthToken('expired-jwt');
    apiClient.defaults.adapter = unauthorizedAdapter;
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);

    expect(await screen.findByText('Welcome back')).toBeTruthy();
    expect(localStorage.getItem('nexora_token')).toBeNull();

    apiClient.defaults.adapter = successAdapter;
    setAuthToken('real-test-jwt');
    cleanup();
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Test Student')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByText('Welcome back')).toBeTruthy();
    expect(localStorage.getItem('nexora_token')).toBeNull();
  });
});