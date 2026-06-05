import { type FormEvent, type ReactNode, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';
import { useTheme } from '../hooks/useTheme';
import LoadingSpinner from './LoadingSpinner';

/* ── decorative background ────────────────────────────────────────────────── */
function Background({ isDark }: { isDark: boolean }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{
        background: isDark
          ? 'linear-gradient(135deg, #0d0a1e 0%, #1a1035 40%, #120d2a 100%)'
          : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #faf5ff 100%)',
      }} />
      <div className="absolute inset-0" style={{
        opacity: isDark ? 0.04 : 0.06,
        backgroundImage: `linear-gradient(${isDark ? '#a78bfa' : '#7c3aed'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#a78bfa' : '#7c3aed'} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      <div className="absolute -top-32 -end-32 w-[520px] h-[520px] rounded-full" style={{
        background: isDark
          ? 'radial-gradient(circle, #7c3aed 0%, #4f46e5 50%, transparent 70%)'
          : 'radial-gradient(circle, #c4b5fd 0%, #a78bfa 50%, transparent 70%)',
        filter: 'blur(60px)', opacity: isDark ? 0.2 : 0.35,
      }} />
      <div className="absolute -bottom-24 -start-24 w-[400px] h-[400px] rounded-full" style={{
        background: isDark
          ? 'radial-gradient(circle, #a855f7 0%, #6d28d9 50%, transparent 70%)'
          : 'radial-gradient(circle, #ddd6fe 0%, #c4b5fd 50%, transparent 70%)',
        filter: 'blur(80px)', opacity: isDark ? 0.15 : 0.5,
      }} />
    </div>
  );
}

/* ── top controls ─────────────────────────────────────────────────────────── */
function TopControls({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { lang, setLang, t } = useLang();

  const btnBase: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)',
    border: `1px solid ${isDark ? 'rgba(167,139,250,0.25)' : 'rgba(139,92,246,0.25)'}`,
    color: isDark ? '#c4b5fd' : '#6d28d9',
    backdropFilter: 'blur(8px)',
  };
  const hoverBg = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.97)';

  return (
    <div className="fixed top-4 end-4 z-10 flex items-center gap-2">
      {/* language */}
      <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        aria-label="Toggle language"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={btnBase}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = hoverBg)}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = btnBase.background as string)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        {t('switchToAr')}
      </button>

      {/* theme */}
      <button type="button" onClick={toggleTheme} aria-label={t('toggleTheme')}
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        style={btnBase}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = hoverBg)}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = btnBase.background as string)}
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        )}
      </button>
    </div>
  );
}

/* ── brand ────────────────────────────────────────────────────────────────── */
function Brand({ isDark }: { isDark: boolean }) {
  const { t } = useLang();
  return (
    <div className="mb-7 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-xl ring-1 ring-violet-500/30"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 32px rgba(139,92,246,0.4)' }}>
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
        </svg>
      </div>
      <h1 className="text-xl font-bold tracking-tight" style={{ color: isDark ? '#ffffff' : '#1e1b4b' }}>{t('brand')}</h1>
      <p className="text-xs mt-1" style={{ color: isDark ? 'rgba(196,181,253,0.7)' : '#7c3aed' }}>{t('tagline')}</p>
    </div>
  );
}

/* ── eye icon ─────────────────────────────────────────────────────────────── */
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

/* ── shared input styles ──────────────────────────────────────────────────── */
function inputStyle(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'rgba(255,255,255,0.07)' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(167,139,250,0.2)' : 'rgba(139,92,246,0.25)'}`,
    color: isDark ? '#ffffff' : '#1e1b4b',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
  };
}
const focusBorder = '#7c3aed';
function blurBorder(isDark: boolean) { return isDark ? 'rgba(167,139,250,0.2)' : 'rgba(139,92,246,0.25)'; }
function labelColor(isDark: boolean) { return isDark ? 'rgba(196,181,253,0.8)' : '#6d28d9'; }

/* ── password field ───────────────────────────────────────────────────────── */
function PasswordField({ value, onChange, autoComplete, label, hint, isDark }: {
  value: string; onChange: (v: string) => void;
  autoComplete: string; label: string; hint?: string; isDark: boolean;
}) {
  const [show, setShow] = useState(false);
  const { t } = useLang();
  return (
    <div>
      <span className="text-xs font-medium mb-1.5 block" style={{ color: labelColor(isDark) }}>{label}</span>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)} required autoComplete={autoComplete}
          className="w-full rounded-xl px-4 py-2.5 pe-11 text-sm outline-none transition-all"
          style={inputStyle(isDark)}
          onFocus={e => (e.target.style.borderColor = focusBorder)}
          onBlur={e => (e.target.style.borderColor = blurBorder(isDark))}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          aria-label={show ? t('hidePassword') : t('showPassword')} tabIndex={-1}
          className="absolute inset-y-0 end-0 flex items-center px-3 opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>
          <EyeIcon open={show} />
        </button>
      </div>
      {hint && <p className="text-xs mt-1" style={{ color: isDark ? 'rgba(196,181,253,0.4)' : '#a78bfa' }}>{hint}</p>}
    </div>
  );
}

/* ── text field ───────────────────────────────────────────────────────────── */
function TextField({ value, onChange, type = 'text', label, autoComplete, autoFocus, isDark }: {
  value: string; onChange: (v: string) => void; type?: string;
  label: string; autoComplete?: string; autoFocus?: boolean; isDark: boolean;
}) {
  return (
    <div>
      <span className="text-xs font-medium mb-1.5 block" style={{ color: labelColor(isDark) }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required autoFocus={autoFocus} autoComplete={autoComplete}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
        style={inputStyle(isDark)}
        onFocus={e => (e.target.style.borderColor = focusBorder)}
        onBlur={e => (e.target.style.borderColor = blurBorder(isDark))}
      />
    </div>
  );
}

/* ── main auth screen ─────────────────────────────────────────────────────── */
function AuthScreen() {
  const auth  = useAuth();
  const toast = useToast();
  const { t } = useLang();
  // Single useTheme call — state shared by all subcomponents via props
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode]                       = useState<'login' | 'register'>('login');
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError]     = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const isRegister = mode === 'register';

  const switchMode = (next: 'login' | 'register') => {
    setMode(next); setUsername(''); setEmail('');
    setPassword(''); setConfirmPassword(''); setPasswordError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRegister && password !== confirmPassword) { setPasswordError(t('passwordMismatch')); return; }
    setPasswordError(''); setSubmitting(true);
    try {
      if (isRegister) { await auth.register(username, email, password); toast.success(t('toastAccCreated')); }
      else             { await auth.login(username, password);           toast.success(t('toastSignedIn'));   }
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : (isRegister ? t('toastRegFail') : t('toastSignFail')));
    } finally { setSubmitting(false); }
  };

  const cardStyle: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(167,139,250,0.15)' : 'rgba(139,92,246,0.2)'}`,
    boxShadow: isDark
      ? '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 8px 40px rgba(109,40,217,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Background isDark={isDark} />
      <TopControls isDark={isDark} toggleTheme={toggleTheme} />
      <Brand isDark={isDark} />

      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="rounded-2xl p-7 space-y-4" style={cardStyle}>
          <div className="mb-1">
            <h2 className="text-lg font-bold" style={{ color: isDark ? '#ffffff' : '#1e1b4b' }}>
              {isRegister ? t('setupTitle') : t('loginTitle')}
            </h2>
            <p className="text-xs mt-1" style={{ color: isDark ? 'rgba(196,181,253,0.6)' : '#7c3aed' }}>
              {isRegister ? t('setupSub') : t('loginSub')}
            </p>
          </div>

          <TextField label={t('usernameLabel')} value={username} onChange={setUsername}
            autoComplete="username" autoFocus isDark={isDark} />

          {isRegister && (
            <TextField label={t('emailLabel')} type="email" value={email} onChange={setEmail}
              autoComplete="email" isDark={isDark} />
          )}

          <PasswordField label={t('passwordLabel')} value={password} onChange={setPassword}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            hint={isRegister ? t('passwordMinHint') : undefined} isDark={isDark} />

          {isRegister && (
            <div>
              <PasswordField label={t('confirmPassLabel')} value={confirmPassword}
                onChange={v => { setConfirmPassword(v); if (passwordError) setPasswordError(''); }}
                autoComplete="new-password" isDark={isDark} />
              {passwordError && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: '#ef4444' }}>{passwordError}</p>
              )}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 mt-1"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}>
            {submitting
              ? (isRegister ? t('creating') : t('signingIn'))
              : (isRegister ? t('createAccount') : t('signin'))}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: isDark ? 'rgba(196,181,253,0.5)' : '#7c3aed' }}>
          {isRegister ? t('haveAccount') : t('noAccountYet')}{' '}
          <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}
            className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
            style={{ color: isDark ? '#a78bfa' : '#5b21b6' }}>
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (auth.isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Background isDark={isDark} />
        <LoadingSpinner />
      </div>
    );
  }

  if (auth.authEnabled && !auth.isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
