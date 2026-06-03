import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API ships under two names depending on the browser.
// We avoid pulling in a full @types/dom-speech-recognition by typing the
// surface we actually use.
interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseVoiceInputOptions {
  lang?: string; // BCP 47 — 'en-US', 'ar-SA', etc.
  onTranscript?: (text: string) => void;
}

export interface UseVoiceInputReturn {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  error: string | null;
}

/**
 * Thin wrapper around the Web Speech API.
 *
 * On `start()`, listens until the user pauses, then fires `onTranscript`
 * with the final concatenated text. Works in Chrome, Edge, Safari (iOS 14.5+).
 * Returns `isSupported: false` in Firefox so callers can hide the button.
 */
export function useVoiceInput({
  lang = 'en-US',
  onTranscript,
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const Ctor = getRecognitionCtor();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [isListening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Ctor) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    setError(null);

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const alt = result?.[0];
        if (alt) transcript += alt.transcript;
      }
      if (transcript) onTranscript?.(transcript.trim());
    };
    recognition.onerror = (e) => {
      setError(e.error || 'voice-recognition-error');
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (e) {
      setError((e as Error)?.message || 'Failed to start voice recognition');
      setListening(false);
    }
  }, [Ctor, lang, onTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  return {
    isSupported: Ctor !== null,
    isListening,
    start,
    stop,
    error,
  };
}
