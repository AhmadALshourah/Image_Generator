/**
 * Sentry initialisation (#27).
 *
 * No-op when `VITE_SENTRY_DSN` is empty (the default). Set it in `.env.local`
 * or via Docker build args to enable error tracking.
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

export function configureSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),
    integrations: [Sentry.browserTracingIntegration()],
  });
}
