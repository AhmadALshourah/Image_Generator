import { useVoiceInput } from '../hooks/useVoiceInput';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  lang?: string;
  disabled?: boolean;
}

export default function VoiceInputButton({ onTranscript, lang = 'en-US', disabled }: VoiceInputButtonProps) {
  const { t } = useLang();
  const toast = useToast();
  const voice = useVoiceInput({
    lang,
    onTranscript: (text) => { onTranscript(text); toast.success(t('toastVoice')); },
  });

  if (!voice.isSupported) return null;

  return (
    <button
      type="button"
      onClick={() => voice.isListening ? voice.stop() : voice.start()}
      disabled={disabled}
      title={voice.isListening ? t('cancelGen') : t('voiceInput')}
      aria-label={t('voiceInput')}
      className={`inline-flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200
                  focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50
                  ${voice.isListening
                    ? 'text-red-500 bg-red-50 dark:bg-red-500/15'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      style={{ '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
    >
      {voice.isListening ? (
        <span className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="h-[18px] w-[18px]">
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-red-500 pulse-ring"
            style={{ '--ring-color': 'rgba(239,68,68,.5)' } as React.CSSProperties} />
        </span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="h-[18px] w-[18px]">
          <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      )}
    </button>
  );
}
