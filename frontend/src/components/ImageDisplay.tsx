import { Link } from 'react-router-dom';

import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DownloadButton from './DownloadButton';
import ShareButton from './ShareButton';
import type { ImageRecord } from '../types/api';

export interface ImageDisplayProps {
  result: ImageRecord | null;
  loading: boolean;
  error: string | null;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl
                      bg-gradient-to-br from-indigo-100 to-violet-100
                      dark:from-indigo-950/40 dark:to-violet-950/40">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
             className="h-8 w-8 text-indigo-500">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Your generated image will appear here.
      </p>
      <Link
        to="/gallery"
        className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Or browse your past creations →
      </Link>
    </div>
  );
}

export default function ImageDisplay({ result, loading, error }: ImageDisplayProps) {
  const ext = result?.output_format === 'jpeg' ? 'jpg' : result?.output_format || 'png';
  const downloadName = result?.uuid ? `gpt-image-${result.uuid.slice(0, 8)}.${ext}` : `image.${ext}`;

  return (
    <div className="card min-h-[24rem]">
      {loading && <LoadingSpinner />}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && !result && <EmptyState />}

      {!loading && !error && result && (
        <div className="space-y-4 animate-slide-up">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <img
              src={result.image_url}
              alt={result.effective_prompt || result.prompt}
              className="h-auto w-full"
              loading="lazy"
            />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700
                               dark:bg-indigo-950/40 dark:text-indigo-300">
                {result.size}
              </span>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700
                               dark:bg-violet-950/40 dark:text-violet-300">
                quality: {result.quality}
              </span>
              <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700
                               dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                bg: {result.background}
              </span>
              {result.cached && (
                <span title="Returned from cache — no API cost"
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700
                                 dark:bg-amber-950/40 dark:text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className="h-3 w-3">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Cached
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700
                               dark:bg-emerald-950/40 dark:text-emerald-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                     className="h-3 w-3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved
              </span>
            </div>

            {result.was_translated && (
              <details className="group rounded-lg bg-amber-50/50 p-3 dark:bg-amber-950/20">
                <summary className="cursor-pointer text-xs font-medium text-amber-800 dark:text-amber-300">
                  ✨ Your prompt was auto-translated to English for better results
                </summary>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-slate-600 dark:text-slate-400" dir="auto">
                    <span className="font-semibold">Original:</span> {result.prompt}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Sent to model:</span> {result.effective_prompt}
                  </p>
                </div>
              </details>
            )}

            <div className="flex flex-wrap gap-2">
              <DownloadButton imageUrl={result.image_url} filename={downloadName} />
              <ShareButton imageUrl={result.image_url} prompt={result.prompt} />
              <Link
                to="/gallery"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition
                           hover:bg-slate-50 active:scale-[0.97]
                           dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                     className="h-3.5 w-3.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                </svg>
                View in gallery
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
