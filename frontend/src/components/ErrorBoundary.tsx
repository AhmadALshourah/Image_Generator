import { Component, type ErrorInfo, type ReactNode } from 'react';

interface FallbackRenderProps {
  error: Error;
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: FallbackRenderProps) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches synchronous render errors in the subtree.
 *
 * React doesn't provide a hook equivalent for this — class components are
 * still the only way to use `componentDidCatch` + `getDerivedStateFromError`.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Route element={<SomePage />} />
 *   </ErrorBoundary>
 *
 * To customize the fallback:
 *   <ErrorBoundary fallback={({ error, reset }) => <MyFallback ... />}>
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In prod this should ship to Sentry / Datadog / whatever.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { fallback } = this.props;
    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.reset });
    }
    if (fallback) return fallback;

    return <DefaultErrorFallback error={error} reset={this.reset} />;
  }
}

function DefaultErrorFallback({ error, reset }: FallbackRenderProps) {
  return (
    <main
      role="alert"
      className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-20 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8 text-red-500"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The page hit an unexpected error and stopped rendering. Your data is safe.
        </p>
      </div>

      <details className="w-full max-w-xl rounded-lg bg-slate-50 p-3 text-left text-xs dark:bg-slate-900/40">
        <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
          Error details
        </summary>
        <pre className="mt-2 overflow-auto text-[11px] text-slate-600 dark:text-slate-400">
          {error.name}: {error.message}
        </pre>
      </details>

      <div className="flex gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Go home
        </button>
      </div>
    </main>
  );
}
