import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../api/queries';
import { streamGenerate, StreamHttpError } from '../api/streamClient';
import type { GenerateRequest, ImageRecord } from '../types/api';

export type GenerationStage =
  | 'idle'
  | 'moderating'
  | 'translating'
  | 'translated'
  | 'cache_check'
  | 'generating'
  | 'saving'
  | 'complete'
  | 'cached';

export interface StreamState {
  stage: GenerationStage;
  partialImage: string | null; // base64 of latest partial frame
  partialIndex: number;
  result: ImageRecord | null;
  error: string | null;
  effectivePrompt: string | null;
  isStreaming: boolean;
}

const INITIAL_STATE: StreamState = {
  stage: 'idle',
  partialImage: null,
  partialIndex: -1,
  result: null,
  error: null,
  effectivePrompt: null,
  isStreaming: false,
};

interface StagePayload {
  stage: GenerationStage;
  effective_prompt?: string;
}

interface PartialPayload {
  index: number;
  b64_json: string;
}

interface ErrorPayload {
  detail: string;
}

export interface UseStreamGenerateReturn extends StreamState {
  start: (payload: GenerateRequest) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

/**
 * Drives a streaming generation against `POST /api/generate/stream`.
 *
 * The hook maintains a small state machine that the UI can render directly:
 *
 *   idle → moderating → [translating → translated] → cache_check
 *       ├─ cached ──→ complete (with cached: true)
 *       └─ generating → (partial × 3) → saving → complete
 *
 * On error, `stage` is preserved (so the UI can highlight WHERE the pipeline
 * failed), `error` carries the human message, and `isStreaming` flips to false.
 */
export function useStreamGenerate(): UseStreamGenerateReturn {
  const [state, setState] = useState<StreamState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const qc = useQueryClient();

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const start = useCallback(
    async (payload: GenerateRequest): Promise<void> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState({ ...INITIAL_STATE, isStreaming: true, stage: 'moderating' });

      try {
        await streamGenerate({
          payload,
          signal: abortRef.current.signal,
          onEvent: ({ event, data }) => {
            let parsed: unknown;
            try {
              parsed = JSON.parse(data);
            } catch {
              return;
            }

            if (event === 'stage') {
              const p = parsed as StagePayload;
              setState((s) => ({
                ...s,
                stage: p.stage,
                effectivePrompt: p.effective_prompt ?? s.effectivePrompt,
              }));
            } else if (event === 'partial') {
              const p = parsed as PartialPayload;
              setState((s) => ({
                ...s,
                partialImage: p.b64_json,
                partialIndex: p.index,
              }));
            } else if (event === 'complete') {
              const record = parsed as ImageRecord;
              setState((s) => ({
                ...s,
                stage: record.cached ? 'cached' : 'complete',
                result: record,
                isStreaming: false,
              }));
              if (!record.cached) {
                qc.invalidateQueries({ queryKey: queryKeys.images.all });
              }
            } else if (event === 'error') {
              const p = parsed as ErrorPayload;
              setState((s) => ({
                ...s,
                // Keep `stage` as-is so the UI shows where the pipeline died.
                error: p.detail || 'Generation failed.',
                isStreaming: false,
              }));
            }
          },
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return; // caller cancelled — state already reset by `stop()`
        }
        const message =
          err instanceof StreamHttpError
            ? `${err.status} — ${err.message}`
            : (err as Error)?.message ?? 'Streaming failed';
        setState((s) => ({ ...s, error: message, isStreaming: false }));
      }
    },
    [qc]
  );

  // Cancel any in-flight stream when the consumer unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { ...state, start, stop, reset };
}
