import { useState, type FormEvent } from 'react';

import AdvancedOptions, { type AdvancedOptionsValues } from './AdvancedOptions';
import EnhancePromptButton from './EnhancePromptButton';
import StylePresets from './StylePresets';
import VoiceInputButton from './VoiceInputButton';
import SimilarPrompts from './SimilarPrompts';
import { useLang } from '../context/LangContext';
import type { GenerateRequest } from '../types/api';

const MAX_LENGTH = 4000;

const SAMPLE_PROMPTS_EN = [
  'A serene Japanese garden at golden hour, koi pond reflecting cherry blossoms',
  'A futuristic city floating above the clouds, cinematic lighting',
  'A cozy reading nook by a rainy window, warm lamp light, photorealistic',
];

const SAMPLE_PROMPTS_AR = [
  'حديقة يابانية هادئة في ساعة الذهب، بركة أسماك تعكس أزهار الكرز',
  'مدينة مستقبلية تحلّق فوق الغيوم، إضاءة سينمائية',
  'زاوية قراءة دافئة بجانب نافذة ممطرة، ضوء مصباح دافئ، فوتوريالستك',
];

const DEFAULT_OPTIONS: AdvancedOptionsValues = {
  size: '1024x1024',
  quality: 'auto',
  background: 'auto',
  output_format: 'png',
  force: false,
};

export interface PromptFormProps {
  onSubmit: (payload: GenerateRequest) => void;
  loading: boolean;
}

function looksArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

function IconSparkles({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

export default function PromptForm({ onSubmit, loading }: PromptFormProps) {
  const { t, lang } = useLang();
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<AdvancedOptionsValues>(DEFAULT_OPTIONS);

  const trimmed = prompt.trim();
  const disabled = loading || trimmed.length < 3;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit({ prompt: trimmed, ...options });
  };

  const appendSuffix = (suffix: string) => {
    setPrompt((p) => (p.trim().length === 0 ? suffix.replace(/^,\s*/, '') : p + suffix));
  };

  const samples = lang === 'ar' ? SAMPLE_PROMPTS_AR : SAMPLE_PROMPTS_EN;

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('describe')}</h2>
        <div className="flex items-center gap-1.5">
          <VoiceInputButton
            onTranscript={(text) => setPrompt((p) => (p ? `${p.trimEnd()} ${text}` : text))}
            lang={looksArabic(prompt) ? 'ar-SA' : 'en-US'}
            disabled={loading}
          />
          <EnhancePromptButton prompt={prompt} onEnhanced={setPrompt} disabled={loading} />
        </div>
      </div>

      {/* textarea */}
      <div className="relative">
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={t('promptPh')}
          rows={5}
          disabled={loading}
          dir="auto"
          className="input-field resize-none"
          style={{ minHeight: '8.5rem' }}
        />
        <span className="absolute bottom-2.5 end-3 text-xs font-mono text-slate-400 dark:text-slate-600">
          {prompt.length} / {MAX_LENGTH}
        </span>
      </div>

      {trimmed.length >= 4 && <SimilarPrompts prompt={trimmed} onPick={setPrompt} />}

      <StylePresets onApply={appendSuffix} disabled={loading} />

      <AdvancedOptions values={options} onChange={setOptions} disabled={loading} />

      {/* footer: samples + submit */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 pt-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">{t('tryASample')}</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {samples.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(sample)}
                disabled={loading}
                dir="auto"
                className="shrink-0 max-w-[12rem] truncate rounded-full px-3 py-1.5 text-xs
                           text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800
                           hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors
                           disabled:opacity-50"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={disabled} className="btn-primary sm:w-auto shrink-0">
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              {t('generating')}
            </>
          ) : (
            <>
              <IconSparkles size={18} />
              {t('generate')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
