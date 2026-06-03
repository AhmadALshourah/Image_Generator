import { useVoiceInput } from '../hooks/useVoiceInput';
import { useToast } from '../context/ToastContext';

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  lang?: string;
  disabled?: boolean;
}

export default function VoiceInputButton({
  onTranscript,
  lang = 'en-US',
  disabled,
}: VoiceInputButtonProps) {
  const toast = useToast();
  const voice = useVoiceInput({
    lang,
    onTranscript: (text) => {
      onTranscript(text);
      toast.success('Voice transcribed');
    },
  });

  if (!voice.isSupported) return null; // hide entirely on Firefox etc.

  const handleClick = () => {
    if (voice.isListening) voice.stop();
    else voice.start();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={voice.isListening ? 'Stop listening' : 'Dictate your prompt'}
      aria-label="Voice input"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition active:scale-[0.97]
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${
                    voice.isListening
                      ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
    >
      {voice.isListening ? (
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="h-4 w-4">
          <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      )}
    </button>
  );
}
