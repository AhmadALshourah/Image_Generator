import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useStreamGenerate } from './useStreamGenerate';
import * as streamClientModule from '../api/streamClient';
import { StreamHttpError } from '../api/streamClient';
import { makeQueryClient } from '../test/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrapper() {
  const qc = makeQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const PAYLOAD = {
  prompt: 'a cat',
  size: '1024x1024' as const,
  quality: 'auto' as const,
  background: 'auto' as const,
  output_format: 'png' as const,
  force: false,
};

const FAKE_RECORD = {
  id: 1, uuid: 'uuid-1', prompt: 'a cat', effective_prompt: 'a cat',
  was_translated: false, size: '1024x1024', quality: 'auto', background: 'auto',
  output_format: 'png', filename: 'uuid-1.png', thumbnail_filename: 'uuid-1-thumb.webp',
  file_size: 1234, cost_usd: 0.04, created_at: '2026-06-05T00:00:00Z', tags: [],
  image_url: '/api/images/files/uuid-1.png', thumbnail_url: '/api/images/files/uuid-1-thumb.webp',
  cached: false,
};

/** Build a mock streamGenerate that fires a sequence of SSE-style events. */
function mockStream(events: Array<{ event: string; data: unknown }>) {
  vi.spyOn(streamClientModule, 'streamGenerate').mockImplementation(
    async ({ onEvent }) => {
      for (const { event, data } of events) {
        onEvent({ event, data: JSON.stringify(data) });
      }
    }
  );
}

// ---------------------------------------------------------------------------

describe('useStreamGenerate', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('starts in idle state', () => {
    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });
    expect(result.current.stage).toBe('idle');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('transitions through stage events and sets result on complete', async () => {
    mockStream([
      { event: 'stage',    data: { stage: 'moderating' } },
      { event: 'stage',    data: { stage: 'cache_check' } },
      { event: 'stage',    data: { stage: 'generating' } },
      { event: 'complete', data: FAKE_RECORD },
    ]);

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });

    await act(async () => { await result.current.start(PAYLOAD); });

    expect(result.current.stage).toBe('complete');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.result?.id).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('captures partial images during generation', async () => {
    mockStream([
      { event: 'stage',   data: { stage: 'generating' } },
      { event: 'partial', data: { index: 0, b64_json: 'ABC==' } },
      { event: 'partial', data: { index: 1, b64_json: 'DEF==' } },
      { event: 'complete', data: FAKE_RECORD },
    ]);

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });
    await act(async () => { await result.current.start(PAYLOAD); });

    expect(result.current.partialImage).toBe('DEF==');
    expect(result.current.partialIndex).toBe(1);
  });

  it('captures effective_prompt from translation stage event', async () => {
    mockStream([
      { event: 'stage',   data: { stage: 'translating', effective_prompt: 'an English cat' } },
      { event: 'complete', data: FAKE_RECORD },
    ]);

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });
    await act(async () => { await result.current.start(PAYLOAD); });

    expect(result.current.effectivePrompt).toBe('an English cat');
  });

  it('sets error state when the server sends an error event', async () => {
    mockStream([
      { event: 'stage', data: { stage: 'moderating' } },
      { event: 'error', data: { detail: 'Prompt violates content policy.' } },
    ]);

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });
    await act(async () => { await result.current.start(PAYLOAD); });

    expect(result.current.error).toBe('Prompt violates content policy.');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.stage).toBe('moderating'); // stage preserved
  });

  it('surfaces StreamHttpError as a readable error message', async () => {
    vi.spyOn(streamClientModule, 'streamGenerate').mockRejectedValue(
      new StreamHttpError(400, 'Bad request')
    );

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });
    await act(async () => { await result.current.start(PAYLOAD); });

    expect(result.current.error).toContain('400');
    expect(result.current.isStreaming).toBe(false);
  });

  it('sets stage to cached when the complete record has cached: true', async () => {
    mockStream([
      { event: 'complete', data: { ...FAKE_RECORD, cached: true } },
    ]);

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });
    await act(async () => { await result.current.start(PAYLOAD); });

    expect(result.current.stage).toBe('cached');
    expect(result.current.result?.cached).toBe(true);
  });

  it('stop() sets isStreaming to false without error', async () => {
    vi.spyOn(streamClientModule, 'streamGenerate').mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });

    act(() => { void result.current.start(PAYLOAD); });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    act(() => result.current.stop());

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reset() clears all state back to idle', async () => {
    mockStream([{ event: 'complete', data: FAKE_RECORD }]);

    const { result } = renderHook(() => useStreamGenerate(), { wrapper: wrapper() });
    await act(async () => { await result.current.start(PAYLOAD); });

    expect(result.current.result).not.toBeNull();

    act(() => result.current.reset());

    expect(result.current.stage).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isStreaming).toBe(false);
  });
});
