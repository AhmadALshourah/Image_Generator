import { type FormEvent, type ReactNode, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';
import LoadingSpinner from './LoadingSpinner';

function AuthScreen() {
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLang();

  const isSetup = auth.needsSetup;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSetup) {
        await auth.register(username, password);
        toast.success(t('toastAccCreated'));
      } else {
        await auth.login(username, password);
        toast.success(t('toastSignedIn'));
      }
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const fallback = isSetup ? t('toastRegFail') : t('toastSignFail');
      toast.error(typeof detail === 'string' ? detail : fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>

      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
             style={{ background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }}>
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">{t('brand')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('tagline')}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="card shadow-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-md space-y-5"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {isSetup ? t('setupTitle') : t('loginTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSetup ? t('setupSub') : t('loginSub')}
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-slate-400 mb-1.5 block">{t('usernameLabel')}</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              minLength={3}
              maxLength={64}
              autoComplete="username"
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-400 mb-1.5 block">{t('passwordLabel')}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSetup ? 6 : 1}
              autoComplete={isSetup ? 'new-password' : 'current-password'}
              className="input-field"
            />
            {isSetup && (
              <p className="text-xs text-slate-500 mt-1">{t('passwordMinHint')}</p>
            )}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full h-11 text-sm font-semibold"
          >
            {submitting
              ? (isSetup ? t('creating') : t('signingIn'))
              : (isSetup ? t('createAccount') : t('signin'))}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (auth.authEnabled && !auth.isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
