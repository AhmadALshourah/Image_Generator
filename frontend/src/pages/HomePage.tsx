import { useEffect, useRef } from 'react';

import PromptForm from '../components/PromptForm';
import ImageDisplay from '../components/ImageDisplay';
import GenerationProgress from '../components/GenerationProgress';
import { useStreamGenerate } from '../hooks/useStreamGenerate';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';
import type { GenerateRequest } from '../types/api';

export default function HomePage() {
  const toast = useToast();
  const { t } = useLang();
  const stream = useStreamGenerate();

  const lastResultId = useRef<number | null>(null);

  useEffect(() => {
    const r = stream.result;
    if (!r || r.id === lastResultId.current) return;
    lastResultId.current = r.id;

    if (r.cached) {
      toast.info(t('toastCached'));
    } else if (r.was_translated) {
      toast.success(t('toastTranslated'));
    } else {
      toast.success(t('toastGenerated'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.result]);

  useEffect(() => {
    if (stream.error) toast.error(stream.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.error]);

  const handleGenerate = (payload: GenerateRequest) => {
    void stream.start(payload);
  };

  const showProgress = stream.isStreaming || Boolean(stream.error);
  const showFinal = !showProgress && stream.result !== null;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 items-start">
        <div className="anim-fadeUp">
          <PromptForm onSubmit={handleGenerate} loading={stream.isStreaming} />
        </div>
        <div className="anim-fadeUp lg:sticky lg:top-24" style={{ animationDelay: '0.08s' }}>
          {showProgress ? (
            <div className="card min-h-[28rem]">
              <GenerationProgress
                stage={stream.stage}
                partialImage={stream.partialImage}
                partialIndex={stream.partialIndex}
                effectivePrompt={stream.effectivePrompt}
                errorMessage={stream.error}
                onStop={stream.isStreaming ? stream.stop : undefined}
              />
            </div>
          ) : (
            <ImageDisplay result={showFinal ? stream.result : null} loading={false} error={null} />
          )}
        </div>
      </div>
    </main>
  );
}
