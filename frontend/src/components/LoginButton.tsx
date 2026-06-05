import { useState, type FormEvent } from 'react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';

export default function LoginButton() {
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLang();
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
          onClick={() => { auth.logout(); toast.info(t('toastSignedOut')); }}
          className="btn-outline h-9 px-3 text-xs"
        >
          {t('signout')}
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await auth.login(username, password);
      toast.success(t('toastSignedIn'));
      setOpen(false);
      setUsername('');
      setPassword('');
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : t('toastSignFail'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center h-10 px-4 rounded-xl text-sm font-semibold text-white"
        style={{ backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }}
      >
        {t('signin')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 anim-fadeIn flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="anim-scaleIn w-full max-w-sm space-y-4 card shadow-2xl"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('ownerSignin')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('authNote')}</p>

            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">{t('usernameLabel')}</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                autoFocus required className="input-field" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">{t('passwordLabel')}</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required className="input-field" />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline h-9 px-4 text-sm">
                {t('cancelLabel')}
              </button>
              <button type="submit" disabled={submitting} className="btn-primary h-9 px-4 text-sm">
                {submitting ? t('signingIn') : t('signin')}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
