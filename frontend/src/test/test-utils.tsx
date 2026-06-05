import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';

import { ToastProvider } from '../context/ToastContext';
import { LangProvider } from '../context/LangContext';

/**
 * Build a fresh QueryClient for each test so caches don't leak between cases.
 * Retries are disabled to keep error paths snappy.
 * gcTime is Infinity to prevent garbage collection during async test operations
 * (gcTime: 0 + onSettled invalidation causes data to be evicted before assertions).
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  client?: QueryClient;
  initialRoute?: string;
}

export function AllProviders({ children, client, initialRoute = '/' }: AllProvidersProps) {
  const qc = client ?? makeQueryClient();
  return (
    <LangProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </LangProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { client?: QueryClient; initialRoute?: string }
) {
  const { client, initialRoute, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders client={client} initialRoute={initialRoute}>
        {children}
      </AllProviders>
    ),
    ...rest,
  });
}
