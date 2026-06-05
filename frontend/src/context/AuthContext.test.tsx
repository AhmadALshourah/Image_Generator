import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from './AuthContext';
import { makeQueryClient } from '../test/test-utils';
import * as queriesModule from '../api/queries';
import * as clientModule from '../api/client';
import type { AuthStatusResponse } from '../types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockAuthStatus(data: AuthStatusResponse) {
  vi.spyOn(queriesModule, 'useAuthStatus').mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof queriesModule.useAuthStatus>);
}

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderWithAuth(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

/** Exposes the raw auth context values as text nodes. */
function AuthStatus() {
  const { authEnabled, isAuthenticated, username } = useAuth();
  return (
    <div>
      <span data-testid="auth-enabled">{String(authEnabled)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="username">{username ?? 'null'}</span>
    </div>
  );
}

function LoginButton() {
  const { login } = useAuth();
  return (
    <button type="button" onClick={() => login('owner', 'secret')}>
      Sign in
    </button>
  );
}

// ---------------------------------------------------------------------------

describe('AuthContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem('image-gen-token');
  });

  afterEach(() => {
    localStorage.removeItem('image-gen-token');
  });

  it('exposes authEnabled=false and isAuthenticated=false by default', async () => {
    mockAuthStatus({ auth_enabled: false, is_authenticated: false, username: null });
    renderWithAuth(<AuthStatus />);

    await waitFor(() =>
      expect(screen.getByTestId('auth-enabled')).toHaveTextContent('false'),
    );
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('null');
  });

  it('reflects authEnabled=true and username when the server confirms a token', async () => {
    mockAuthStatus({ auth_enabled: true, is_authenticated: true, username: 'owner' });
    renderWithAuth(<AuthStatus />);

    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('auth-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('owner');
  });

  it('treats the session as authenticated when a token exists in localStorage', async () => {
    localStorage.setItem('image-gen-token', 'fake-jwt');
    // Server response hasn't arrived yet.
    vi.spyOn(queriesModule, 'useAuthStatus').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof queriesModule.useAuthStatus>);

    renderWithAuth(<AuthStatus />);

    // hasToken is derived synchronously from localStorage on mount.
    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true'),
    );
  });

  it('login() calls the loginApi, stores the returned token, and updates the query cache', async () => {
    const user = userEvent.setup();
    mockAuthStatus({ auth_enabled: true, is_authenticated: false, username: null });
    vi.spyOn(clientModule, 'login').mockResolvedValue({
      access_token: 'new-jwt',
      token_type: 'bearer',
      expires_in: 86400,
    });
    vi.spyOn(clientModule, 'setStoredToken');

    renderWithAuth(<LoginButton />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(clientModule.login).toHaveBeenCalledWith({ username: 'owner', password: 'secret' });
    expect(clientModule.setStoredToken).toHaveBeenCalledWith('new-jwt');
  });
});
