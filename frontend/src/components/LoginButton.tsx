import { useState, type FormEvent } from 'react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Header widget: shows a "Sign in" button when auth is enabled and the user
 * isn't logged in. After login, shows the username + "Sign out".
 *
 * If auth is disabled on the backend (AUTH_ENABLED=false), this renders nothing.
 */
export default function LoginButton() {
  const auth = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (auth.isLoading || !auth.authEnabled) return null;

  if (auth.isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">
          {auth.username ?? 'owner'}
        </span>
        <button
          type="button"
          onClick={() => {
            auth.logout();
            toast.info('Signed out');
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700
                     transition hover:bg-slate-50
                     dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await auth.login(username, password);
      toast.success('Signed in');
      setOpen(false);
      setUsername('');
      setPassword('');
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700
                   transition hover:bg-slate-50
                   dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Sign in
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl
                       dark:border-slate-800 dark:bg-slate-950"
          >
            <h2 className="text-lg font-bold">Owner sign-in</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authentication protects write operations (generate / delete / edit tags).
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700
                           transition hover:bg-slate-50
                           dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
