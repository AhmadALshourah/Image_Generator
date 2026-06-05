import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { useDeleteImage, useGenerateImage } from './queries';
import { makeQueryClient } from '../test/test-utils';
import * as clientModule from './client';
import type { ImageRecord } from '../types/api';

function wrapper(client = makeQueryClient()) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function makeImage(overrides: Partial<ImageRecord> = {}): ImageRecord {
  return {
    id: 1,
    uuid: 'uuid-1',
    prompt: 'a cat',
    effective_prompt: 'a cat',
    was_translated: false,
    size: '1024x1024',
    quality: 'auto',
    background: 'auto',
    output_format: 'png',
    filename: 'uuid-1.png',
    thumbnail_filename: 'uuid-1-thumb.webp',
    file_size: 1234,
    cost_usd: 0,
    created_at: '2026-06-03T00:00:00Z',
    tags: [],
    image_url: '/api/images/files/uuid-1.png',
    thumbnail_url: '/api/images/files/uuid-1-thumb.webp',
    cached: false,
    ...overrides,
  };
}

describe('useGenerateImage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the generated record on success', async () => {
    const fake = makeImage({ id: 7 });
    vi.spyOn(clientModule, 'generateImage').mockResolvedValue(fake);

    const { result } = renderHook(() => useGenerateImage(), { wrapper: wrapper() });

    await act(async () => {
      result.current.mutate({
        prompt: 'a cat',
        size: '1024x1024',
        quality: 'auto',
        background: 'auto',
        output_format: 'png',
        force: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fake);
  });

  it('surfaces errors', async () => {
    vi.spyOn(clientModule, 'generateImage').mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useGenerateImage(), { wrapper: wrapper() });

    await act(async () => {
      result.current.mutate({
        prompt: 'a cat',
        size: '1024x1024',
        quality: 'auto',
        background: 'auto',
        output_format: 'png',
        force: false,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('boom');
  });
});

describe('useDeleteImage', () => {
  it('runs optimistic update + rollback on error', async () => {
    const qc = makeQueryClient();

    // Seed the cache as if a list query had already populated it.
    const listKey = ['images', 'list', { limit: 12, offset: 0 }];
    qc.setQueryData(listKey, {
      items: [makeImage({ id: 1 }), makeImage({ id: 2 })],
      total: 2,
      limit: 12,
      offset: 0,
    });

    vi.spyOn(clientModule, 'deleteImage').mockRejectedValue(new Error('server says no'));

    const { result } = renderHook(() => useDeleteImage(), { wrapper: wrapper(qc) });

    await act(async () => {
      result.current.mutate(1);
    });

    // Immediately after onMutate fires, the cache should be reduced.
    // (May settle by the time we read, but the final invalidation puts it back.)
    await waitFor(() => expect(result.current.isError).toBe(true));

    // After error + onSettled invalidation, the stale data should NOT contain id=1
    // until refetch — but we never refetch in the test (no queryFn registered),
    // so the cache should have been rolled back to the original 2 items.
    const final = qc.getQueryData(listKey) as { items: ImageRecord[]; total: number };
    expect(final.items.map((i) => i.id).sort()).toEqual([1, 2]);
    expect(final.total).toBe(2);
  });
});
