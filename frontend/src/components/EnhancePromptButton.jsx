import { useState } from 'react';
import { enhancePrompt as enhancePromptApi } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

export default function EnhancePromptButton({ prompt, onEnhanced, disabled }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleClick = async () => {
    const trimmed = (prompt || '').trim();
    if (trimmed.length < 2) {
      toast.error('Type at least 2 characters first.');
      return;
    }
    setLoading(true);
    try {
      const result = await enhancePromptApi(trimmed);
      onEnhanced?.(result.enhanced);
      toast.success('Prompt enhanced with GPT-4o-mini');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Enhancement failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      title="Expand your prompt with GPT for better results"
      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition
                 hover:border-violet-300 hover:bg-violet-100 active:scale-[0.97]
                 disabled:cursor-not-allowed disabled:opacity-50
                 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300
                 dark:hover:bg-violet-950/60"
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="h-3.5 w-3.5">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
        </svg>
      )}
      {loading ? 'Enhancing...' : 'Enhance with AI'}
    </button>
  );
}
