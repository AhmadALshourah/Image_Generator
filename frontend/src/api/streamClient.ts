/**
 * POST + Server-Sent Events client.
 *
 * The native `EventSource` API only supports GET, so for our POST-with-body
 * streaming endpoint we use `fetch` + `ReadableStream` + a small inline SSE
 * parser. AbortController is wired in so the caller can cancel a generation
 * mid-flight (e.g. user navigates away or clicks "Stop").
 *
 * No external dependencies — ~40 lines of standard browser APIs.
 */
import type { GenerateRequest } from '../types/api';
import { getStoredToken } from './client';

export interface ParsedSSE {
  event: string;
  data: string;
}

export interface StreamGenerateOptions {
  payload: GenerateRequest;
  signal?: AbortSignal;
  onEvent: (event: ParsedSSE) => void;
}

export class StreamHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'StreamHttpError';
    this.status = status;
  }
}

export async function streamGenerate({
  payload,
  signal,
  onEvent,
}: StreamGenerateOptions): Promise<void> {
  const token = getStoredToken();
  const response = await fetch('/api/generate/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new StreamHttpError(response.status, text || response.statusText || 'Request failed');
  }
  if (!response.body) {
    throw new StreamHttpError(0, 'Response has no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by a blank line ("\n\n" or "\r\n\r\n").
      let separatorIdx = findMessageBoundary(buffer);
      while (separatorIdx !== -1) {
        const rawMessage = buffer.slice(0, separatorIdx.start);
        buffer = buffer.slice(separatorIdx.end);
        const parsed = parseSSEMessage(rawMessage);
        if (parsed) onEvent(parsed);
        separatorIdx = findMessageBoundary(buffer);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

interface Boundary {
  start: number;
  end: number;
}

function findMessageBoundary(buffer: string): Boundary | -1 {
  const crlfCrlf = buffer.indexOf('\r\n\r\n');
  const lfLf = buffer.indexOf('\n\n');
  if (crlfCrlf !== -1 && (lfLf === -1 || crlfCrlf < lfLf)) {
    return { start: crlfCrlf, end: crlfCrlf + 4 };
  }
  if (lfLf !== -1) {
    return { start: lfLf, end: lfLf + 2 };
  }
  return -1;
}

function parseSSEMessage(raw: string): ParsedSSE | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue; // empty / comment

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const valueRaw = colon === -1 ? '' : line.slice(colon + 1);
    // The SSE spec says a single leading space in the value is stripped.
    const value = valueRaw.startsWith(' ') ? valueRaw.slice(1) : valueRaw;

    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
