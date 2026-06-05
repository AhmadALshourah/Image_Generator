import { useEnhancePrompt } from '../api/queries';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';

export interface EnhancePromptButtonProps {
  prompt: string;
  onEnhanced?: (enhanced: string) => void;
  disabled?: boolean;
}

export default function EnhancePromptButton({ prompt, onEnhanced, disabled }: EnhancePromptButtonProps) {
  const { t } = useLang();
  const toast = useToast();
  const enhance = useEnhancePrompt();

  const handleClick = () => {
    const trimmed = (prompt || '').trim();
    if (trimmed.length < 2) { toast.error(t('toastMin2')); return; }
    enhance.mutate(trimmed, {
      onSuccess: (result) => { onEnhanced?.(result.enhanced); toast.success(t('toastEnhanced')); },
      onError: (err) => {
        const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
        toast.error(typeof detail === 'string' ? detail : t('toastEnhFail'));
      },
    });
  };

  const isLoading = enhance.isPending;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={t('enhanceAI')}
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-semibold
                 text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15
                 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors
                 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="h-4 w-4">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
      )}
      <span className="hidden sm:inline">{isLoading ? t('enhancing') : t('enhanceAI')}</span>
    </button>
  );
}
