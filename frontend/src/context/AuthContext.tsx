import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getStoredToken, login as loginApi, setStoredToken } from '../api/client';
import { useAuthStatus } from '../api/queries';

interface AuthState {
  authEnabled: boolean;
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

interface AuthApi extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const statusQuery = useAuthStatus();
  const [hasToken, setHasToken] = useState<boolean>(() => getStoredToken() !== null);

  // Track localStorage changes (e.g. logout in another tab).
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

  const doLogout = useCallback(() => {
    setStoredToken(null);
    setHasToken(false);
    qc.invalidateQueries({ queryKey: ['auth', 'status'] });
  }, [qc]);

  const status = statusQuery.data;

  const value: AuthApi = {
    authEnabled: status?.auth_enabled ?? false,
    isAuthenticated: (status?.is_authenticated ?? false) || hasToken,
    username: status?.username ?? null,
    isLoading: statusQuery.isLoading,
    login: doLogin,
    logout: doLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
