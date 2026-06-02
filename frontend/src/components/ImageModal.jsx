import { useEffect } from 'react';
import DownloadButton from './DownloadButton.jsx';
import ShareButton from './ShareButton.jsx';
import DeleteButton from './DeleteButton.jsx';

export default function ImageModal({ image, onClose, onDelete, deleting }) {
  useEffect(() => {
    if (!image) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [image, onClose]);

  if (!image) return null;

  const formattedDate = new Date(image.created_at).toLocaleString();
  const ext = image.output_format === 'jpeg' ? 'jpg' : image.output_format || 'png';
  const downloadName = `gpt-image-${image.uuid?.slice(0, 8) || image.id}.${ext}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl
                   dark:border-slate-800 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md
                     hover:bg-white dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="grid max-h-[92vh] grid-cols-1 md:grid-cols-[1.6fr_1fr]">
          <div className="flex items-center justify-center bg-slate-100 p-2 dark:bg-slate-900">
            <img
              src={image.image_url}
              alt={image.effective_prompt || image.prompt}
              className="max-h-[88vh] w-auto object-contain"
            />
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                Prompt
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200" dir="auto">
                {image.prompt}
              </p>
            </div>

            {image.was_translated && image.effective_prompt && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  ✨ Translated → English (sent to model)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {image.effective_prompt}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                {image.size}
              </span>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                quality: {image.quality}
              </span>
              <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 font-medium text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                bg: {image.background}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {image.output_format?.toUpperCase()}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-500">
              <p>Created: {formattedDate}</p>
              {image.file_size > 0 && (
                <p>Size: {(image.file_size / 1024).toFixed(1)} KB</p>
              )}
            </div>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <DownloadButton imageUrl={image.image_url} filename={downloadName} />
              <ShareButton imageUrl={image.image_url} prompt={image.prompt} />
              {onDelete && (
                <DeleteButton onConfirm={() => onDelete(image)} disabled={deleting} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
