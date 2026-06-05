import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useVoiceInput } from './useVoiceInput';

// ---------------------------------------------------------------------------
// Minimal SpeechRecognition mock
// ---------------------------------------------------------------------------

function makeMockRecognition() {
  return {
    continuous: false,
    interimResults: false,
    lang: '',
    onresult: null as ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string; isFinal: boolean }>> }) => void) | null,
    onerror: null as ((e: { error: string }) => void) | null,
    onend: null as (() => void) | null,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
  };
}

type MockRecognition = ReturnType<typeof makeMockRecognition>;

let mockInstance: MockRecognition;

function installMock() {
  mockInstance = makeMockRecognition();
  const Ctor = vi.fn(() => mockInstance);
  Object.defineProperty(window, 'SpeechRecognition', {
    value: Ctor,
    writable: true,
    configurable: true,
  });
}

function removeMock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).SpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).webkitSpeechRecognition;
}

// ---------------------------------------------------------------------------

describe('useVoiceInput', () => {
  beforeEach(installMock);
  afterEach(() => {
    vi.restoreAllMocks();
    removeMock();
  });

  it('reports isSupported = true when SpeechRecognition exists', () => {
    const { result } = renderHook(() => useVoiceInput());
    expect(result.current.isSupported).toBe(true);
  });

  it('starts listening after start() is called', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    expect(mockInstance.start).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(true);
  });

  it('fires onTranscript with the recognised text', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoiceInput({ onTranscript }));
    act(() => result.current.start());

    act(() => {
      mockInstance.onresult?.({
        resultIndex: 0,
        results: [[{ transcript: '  hello world  ', isFinal: true }]],
      });
    });

    expect(onTranscript).toHaveBeenCalledWith('hello world');
  });

  it('stops listening after stop() is called', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(mockInstance.stop).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(false);
  });

  it('sets isListening = false and exposes error message on recognition error', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());

    act(() => {
      mockInstance.onerror?.({ error: 'not-allowed' });
    });

    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toBe('not-allowed');
  });

  it('sets isListening = false when the recognition ends naturally', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    act(() => {
      mockInstance.onend?.();
    });
    expect(result.current.isListening).toBe(false);
  });

  it('reports isSupported = false when SpeechRecognition is absent', () => {
    removeMock();
    const { result } = renderHook(() => useVoiceInput());
    expect(result.current.isSupported).toBe(false);
  });

  it('sets an error without crashing when start() is called in unsupported browser', () => {
    removeMock();
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    expect(result.current.error).toBeTruthy();
    expect(result.current.isListening).toBe(false);
  });
});
