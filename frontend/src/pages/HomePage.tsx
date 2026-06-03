import { useEffect, useRef } from 'react';

import PromptForm from '../components/PromptForm';
import ImageDisplay from '../components/ImageDisplay';
import GenerationProgress from '../components/GenerationProgress';
import { useStreamGenerate } from '../hooks/useStreamGenerate';
import { useToast } from '../context/ToastContext';
import type { GenerateRequest } from '../types/api';

export default function HomePage() {
  const toast = useToast();
  const stream = useStreamGenerate();

  const lastResultId = useRef<number | null>(null);

  // Fire a single toast each time a new result lands.
  useEffect(() => {
    const r = stream.result;
    if (!r || r.id === lastResultId.current) return;
    lastResultId.current = r.id;

    if (r.cached) {
      toast.info(
        'Returned a cached image (no API cost). Toggle "Force re-generation" for a new one.'
      );
    } else if (r.was_translated) {
      toast.success('Image generated — your prompt was auto-translated to English first.');
    } else {
      toast.success('Image generated and saved');
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Turn words into{' '}
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            images
          </span>
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          Powered by <span className="font-semibold">gpt-image-1</span> with{' '}
          <span className="font-semibold">streaming partials</span> — watch the image take shape live.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PromptForm onSubmit={handleGenerate} loading={stream.isStreaming} />

        {showProgress ? (
          <div className="card min-h-[24rem]">
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
    </main>
  );
}
