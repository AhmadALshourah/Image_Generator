import { type FormEvent, type ReactNode, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';
import LoadingSpinner from './LoadingSpinner';

/* ── decorative background ────────────────────────────────────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* base gradient */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1035 40%, #120d2a 100%)' }} />

      {/* grid lines */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#a78bfa 1px, transparent 1px), linear-gradient(90deg, #a78bfa 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

      {/* orb — top right */}
      <div className="absolute -top-32 -end-32 w-[520px] h-[520px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #7c3aed 0%, #4f46e5 50%, transparent 70%)',
          filter: 'blur(60px)',
        }} />

      {/* orb — bottom left */}
      <div className="absolute -bottom-24 -start-24 w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, #6d28d9 50%, transparent 70%)',
          filter: 'blur(80px)',
        }} />

      {/* orb — center subtle */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(ellipse, #818cf8 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
    </div>
  );
}

/* ── brand logo ───────────────────────────────────────────────────────────── */
function Brand() {
  const { t } = useLang();
  return (
    <div className="mb-8 text-center">
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-xl ring-1 ring-violet-500/30"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 0 32px rgba(139,92,246,0.4)',
        }}
      >
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-white tracking-tight">{t('brand')}</h1>
      <p className="text-xs text-violet-300/70 mt-1">{t('tagline')}</p>
    </div>
  );
}

/* ── main auth screen ─────────────────────────────────────────────────────── */
function AuthScreen() {
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLang();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const isRegister = mode === 'register';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await auth.register(username, password);
        toast.success(t('toastAccCreated'));
      } else {
        await auth.login(username, password);
        toast.success(t('toastSignedIn'));
      }
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : (isRegister ? t('toastRegFail') : t('toastSignFail')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Background />

      <Brand />

      {/* card */}
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-7 space-y-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(167,139,250,0.15)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* heading */}
          <div>
            <h2 className="text-lg font-bold text-white">
              {isRegister ? t('setupTitle') : t('loginTitle')}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.6)' }}>
              {isRegister ? t('setupSub') : t('loginSub')}
            </p>
          </div>

          {/* username */}
          <label className="block">
            <span className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(196,181,253,0.8)' }}>
              {t('usernameLabel')}
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              minLength={3}
              maxLength={64}
              autoComplete="username"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(167,139,250,0.2)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(167,139,250,0.2)')}
            />
          </label>

          {/* password */}
          <label className="block">
            <span className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(196,181,253,0.8)' }}>
              {t('passwordLabel')}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 6 : 1}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(167,139,250,0.2)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(167,139,250,0.2)')}
            />
            {isRegister && (
              <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.4)' }}>{t('passwordMinHint')}</p>
            )}
          </label>

          {/* submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
            }}
            onMouseEnter={e => !submitting && ((e.target as HTMLElement).style.boxShadow = '0 4px 28px rgba(139,92,246,0.55)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.boxShadow = '0 4px 20px rgba(139,92,246,0.35)')}
          >
            {submitting
              ? (isRegister ? t('creating') : t('signingIn'))
              : (isRegister ? t('createAccount') : t('signin'))}
          </button>
        </form>

        {/* toggle link */}
        <p className="mt-5 text-center text-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
          {isRegister ? t('haveAccount') : t('noAccountYet')}{' '}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? 'login' : 'register')}
            className="font-medium transition-colors"
            style={{ color: '#a78bfa' }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = '#c4b5fd')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = '#a78bfa')}
          >
            {isRegister ? t('signin') : t('createAccount')}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ── gate wrapper ─────────────────────────────────────────────────────────── */
export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Background />
        <LoadingSpinner />
      </div>
    );
  }

  if (auth.authEnabled && !auth.isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
