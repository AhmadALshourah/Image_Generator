import ErrorMessage from './ErrorMessage';
import type { GenerationStage } from '../hooks/useStreamGenerate';

interface StageDef {
  id: GenerationStage;
  label: string;
  hint?: string;
}

const STAGES: StageDef[] = [
  { id: 'moderating', label: 'Moderating prompt', hint: 'Safety check (~80ms)' },
  { id: 'translating', label: 'Translating to English', hint: 'GPT-4o-mini · only if Arabic' },
  { id: 'cache_check', label: 'Checking cache', hint: 'Same prompt? Skip generation.' },
  { id: 'generating', label: 'Generating image', hint: 'gpt-image-1 · streaming partials' },
  { id: 'saving', label: 'Saving + thumbnail', hint: 'Pillow WebP in parallel' },
];

function stageIndex(stage: GenerationStage): number {
  return STAGES.findIndex((s) => s.id === stage);
}

export interface GenerationProgressProps {
  stage: GenerationStage;
  partialImage: string | null;
  partialIndex: number;
  effectivePrompt: string | null;
  errorMessage: string | null;
  onStop?: () => void;
}

export default function GenerationProgress({
  stage,
  partialImage,
  partialIndex,
  effectivePrompt,
  errorMessage,
  onStop,
}: GenerationProgressProps) {
  const currentIdx = stageIndex(stage);
  const isComplete = stage === 'complete' || stage === 'cached';
  const isError = Boolean(errorMessage);
  const isLive = !isComplete && !isError;

  // Translation row only renders if it's either active or already happened.
  const showTranslating =
    stage === 'translating' || stage === 'translated' || effectivePrompt !== null;

  const visibleStages = STAGES.filter((s) => s.id !== 'translating' || showTranslating);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Live preview area */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
        <div className="aspect-square">
          {partialImage ? (
            <img
              key={partialIndex}
              src={`data:image/png;base64,${partialImage}`}
              alt={`Partial render ${partialIndex + 1}`}
              className="h-full w-full object-cover animate-fade-in"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/40 dark:to-violet-950/40">
                <svg
                  className={`h-6 w-6 text-indigo-500 ${isLive ? 'animate-spin' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <path
                    d="M4 12a8 8 0 0 1 8-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Partial previews will appear here as gpt-image-1 refines the image.
              </p>
            </div>
          )}
        </div>

        {partialImage && isLive && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Refining · pass {partialIndex + 1}/3
            </div>
          </div>
        )}
      </div>

      {/* Error banner (preserves the stage list so users see where it failed) */}
      {isError && errorMessage && <ErrorMessage message={errorMessage} />}

      {/* Stage list */}
      <ul className="space-y-2">
        {visibleStages.map((s) => {
          const idx = stageIndex(s.id);
          const isStageDone =
            (currentIdx > idx && currentIdx !== -1) ||
            // translating "completes" the moment we transition to translated/cache_check
            (s.id === 'translating' && stage !== 'moderating' && effectivePrompt !== null);
          const isStageActive = stage === s.id && !isError;
          const isStageFailed = stage === s.id && isError;
          const isStagePending = !isStageDone && !isStageActive && !isStageFailed;

          return (
            <li key={s.id} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition ${
                  isStageDone
                    ? 'bg-emerald-500'
                    : isStageActive
                    ? 'bg-indigo-500 ring-4 ring-indigo-500/20'
                    : isStageFailed
                    ? 'bg-red-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {isStageDone ? (
                  <svg
                    className="h-3 w-3 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isStageActive ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                ) : isStageFailed ? (
                  <svg
                    className="h-3 w-3 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : null}
              </span>
              <div className={isStagePending ? 'opacity-40' : ''}>
                <p className={`leading-tight ${isStageActive || isStageFailed ? 'font-semibold' : ''}`}>
                  {s.label}
                </p>
                {s.hint && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-500">{s.hint}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Translation reveal */}
      {effectivePrompt && (
        <div className="rounded-lg bg-amber-50/50 p-3 text-xs dark:bg-amber-950/20">
          <p className="font-medium text-amber-800 dark:text-amber-300">
            ✨ Translated to English (sent to model)
          </p>
          <p className="mt-1 text-slate-700 dark:text-slate-300">{effectivePrompt}</p>
        </div>
      )}

      {/* Cancel button while in-flight */}
      {isLive && onStop && (
        <button
          type="button"
          onClick={onStop}
          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
        >
          Cancel generation
        </button>
      )}
    </div>
  );
}
