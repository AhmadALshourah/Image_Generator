import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getStoredToken, login as loginApi, register as registerApi, setStoredToken } from '../api/client';
import { useAuthStatus } from '../api/queries';

interface AuthState {
  authEnabled: boolean;
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  needsSetup: boolean;
  isAdmin: boolean;
}

interface AuthApi extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const statusQuery = useAuthStatus();
  const [hasToken, setHasToken] = useState<boolean>(() => getStoredToken() !== null);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'image-gen-token') setHasToken(e.newValue !== null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const doLogin = useCallback(
    async (username: string, password: string) => {
      const { access_token } = await loginApi({ username, password });
      setStoredToken(access_token);
      setHasToken(true);
      await qc.invalidateQueries({ queryKey: ['auth', 'status'] });
    },
    [qc]
  );

  const doRegister = useCallback(
    async (username: string, email: string, password: string) => {
      const { access_token } = await registerApi({ username, email, password });
      setStoredToken(access_token);
      setHasToken(true);
      await qc.invalidateQueries({ queryKey: ['auth', 'status'] });
    },
    [qc]
  );

  const doLogout = useCallback(() => {
    setStoredToken(null);
    setHasToken(false);
    qc.invalidateQueries({ queryKey: ['auth', 'status'] });
  }, [qc]);

  const status = statusQuery.data;

  const value: AuthApi = {
    authEnabled: status?.auth_enabled ?? true,
    isAuthenticated: (status?.is_authenticated ?? false) || hasToken,
    username: status?.username ?? null,
    isLoading: statusQuery.isLoading,
    needsSetup: status?.needs_setup ?? false,
    isAdmin: status?.role === 'admin',
    login: doLogin,
    register: doRegister,
    logout: doLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
