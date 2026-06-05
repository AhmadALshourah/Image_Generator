import ErrorMessage from './ErrorMessage';
import { useLang } from '../context/LangContext';
import type { GenerationStage } from '../hooks/useStreamGenerate';

interface StageDef {
  id: GenerationStage;
  labelKey: string;
  hintKey: string;
}

const STAGES: StageDef[] = [
  { id: 'moderating',  labelKey: 'stageModerate',   hintKey: 'stageModerateH' },
  { id: 'translating', labelKey: 'stageTranslate',  hintKey: 'stageTranslateH' },
  { id: 'cache_check', labelKey: 'stageCache',      hintKey: 'stageCacheH' },
  { id: 'generating',  labelKey: 'stageGen',        hintKey: 'stageGenH' },
  { id: 'saving',      labelKey: 'stageSave',       hintKey: 'stageSaveH' },
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
  stage, partialImage, partialIndex, effectivePrompt, errorMessage, onStop,
}: GenerationProgressProps) {
  const { t } = useLang();
  const currentIdx = stageIndex(stage);
  const isComplete = stage === 'complete' || stage === 'cached';
  const isError = Boolean(errorMessage);
  const isLive = !isComplete && !isError;

  const showTranslating =
    stage === 'translating' || stage === 'translated' || effectivePrompt !== null;

  const visibleStages = STAGES.filter((s) => s.id !== 'translating' || showTranslating);

  return (
    <div className="space-y-5 anim-fadeIn">
      {/* preview area */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 bg-slate-100 dark:bg-slate-950">
        {partialImage ? (
          <img
            key={partialIndex}
            src={`data:image/png;base64,${partialImage}`}
            alt={`Partial render ${partialIndex + 1}`}
            className="h-full w-full object-cover anim-reveal"
          />
        ) : (
          <div className="shimmer absolute inset-0 bg-slate-200 dark:bg-slate-800 grid place-items-center">
            <div className="relative" style={{ width: 48, height: 48 }}>
              <div
                className="absolute inset-0 rounded-full blur-md opacity-50"
                style={{ backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }}
              />
              <div
                className="spin absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 70%, var(--brand-2))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
                }}
              />
            </div>
          </div>
        )}

        {partialImage && isLive && (
          <div className="absolute bottom-3 start-3 anim-fadeIn flex items-center gap-2 rounded-full bg-slate-950/70 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white">
            <span
              className="h-2 w-2 rounded-full pulse-ring"
              style={{ backgroundColor: '#34d399', '--ring-color': 'rgba(52,211,153,.5)' } as React.CSSProperties}
            />
            {t('refining')} {partialIndex + 1}/3
          </div>
        )}
      </div>

      {isError && errorMessage && <ErrorMessage message={errorMessage} />}

      {/* stage list */}
      <ul className="space-y-3.5">
        {visibleStages.map((s) => {
          const idx = stageIndex(s.id);
          const isStageDone =
            (currentIdx > idx && currentIdx !== -1) ||
            (s.id === 'translating' && stage !== 'moderating' && effectivePrompt !== null);
          const isStageActive = stage === s.id && !isError;
          const isStageFailed = stage === s.id && isError;
          const isStagePending = !isStageDone && !isStageActive && !isStageFailed;

          return (
            <li
              key={s.id}
              className={`flex items-start gap-3 transition-opacity duration-300 ${isStagePending ? 'opacity-40' : 'opacity-100'}`}
            >
              <span className="mt-0.5 shrink-0">
                {isStageDone ? (
                  <span className="grid place-items-center h-5 w-5 rounded-full bg-emerald-500 text-white anim-scaleIn">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                ) : isStageActive ? (
                  <span className="grid place-items-center h-5 w-5 rounded-full">
                    <span
                      className="h-3 w-3 rounded-full pulse-ring"
                      style={{ backgroundColor: 'var(--brand-1)', '--ring-color': 'rgba(99,102,241,.5)' } as React.CSSProperties}
                    />
                  </span>
                ) : isStageFailed ? (
                  <span className="grid place-items-center h-5 w-5 rounded-full bg-red-500 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                ) : (
                  <span className="grid place-items-center h-5 w-5 rounded-full ring-1 ring-slate-300 dark:ring-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${isStageActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                  {t(s.labelKey)}
                </span>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  {t(s.hintKey)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {effectivePrompt && (
        <div className="anim-fadeUp rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/25 px-4 py-3">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-300 mb-1">
            ✦ {t('translatedTo')}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-200" dir="ltr">{effectivePrompt}</p>
        </div>
      )}

      {isLive && onStop && (
        <button
          type="button"
          onClick={onStop}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {t('cancelGen')}
        </button>
      )}
    </div>
  );
}
