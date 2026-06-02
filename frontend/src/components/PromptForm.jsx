import { useState } from 'react';
import AdvancedOptions from './AdvancedOptions.jsx';
import EnhancePromptButton from './EnhancePromptButton.jsx';

const MAX_LENGTH = 4000;

const SAMPLE_PROMPTS = [
  'A serene Japanese garden at golden hour, koi pond reflecting cherry blossoms',
  'A futuristic city floating above the clouds, cinematic lighting',
  'A cozy reading nook by a rainy window, warm lamp light, photorealistic',
];

const DEFAULT_OPTIONS = {
  size: '1024x1024',
  quality: 'auto',
  background: 'auto',
  output_format: 'png',
  force: false,
};

export default function PromptForm({ onSubmit, loading }) {
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const trimmed = prompt.trim();
  const disabled = loading || trimmed.length < 3;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit({ prompt: trimmed, ...options });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="prompt" className="block text-sm font-semibold">
            Describe your image
          </label>
          <EnhancePromptButton
            prompt={prompt}
            onEnhanced={setPrompt}
            disabled={loading}
          />
        </div>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="A majestic dragon flying over snow-capped mountains at sunset... (Arabic prompts are auto-translated for best results)"
          rows={5}
          disabled={loading}
          dir="auto"
          className="input-field resize-none"
        />
        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{trimmed.length < 3 ? 'Minimum 3 characters' : ' '}</span>
          <span>{prompt.length} / {MAX_LENGTH}</span>
        </div>
      </div>

      <AdvancedOptions values={options} onChange={setOptions} disabled={loading} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(sample)}
              disabled={loading}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600
                         transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700
                         disabled:opacity-50
                         dark:border-slate-700 dark:text-slate-400
                         dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
            >
              Try sample #{i + 1}
            </button>
          ))}
        </div>

        <button type="submit" disabled={disabled} className="btn-primary sm:w-auto">
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className="h-4 w-4">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>
    </form>
  );
}
