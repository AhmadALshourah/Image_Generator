import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';

export default function LoginButton() {
  const auth = useAuth();
  const toast = useToast();
  const { t } = useLang();

  if (auth.isLoading || !auth.isAuthenticated) return null;

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
