import { useEffect } from 'react';

import DownloadButton from './DownloadButton';
import ShareButton from './ShareButton';
import DeleteButton from './DeleteButton';
import ActionButton from './ActionButton';
import TagEditor from './TagEditor';
import { useLang } from '../context/LangContext';
import type { ImageRecord } from '../types/api';

export interface ImageModalProps {
  image: ImageRecord | null;
  onClose: () => void;
  onDelete?: (image: ImageRecord) => void;
  onRegenerate?: (image: ImageRecord) => void;
  deleting?: boolean;
  regenerating?: boolean;
}

export default function ImageModal({
  image, onClose, onDelete, onRegenerate, deleting, regenerating,
}: ImageModalProps) {
  const { t } = useLang();

  useEffect(() => {
    if (!image) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
    <div className="fixed inset-0 z-50 anim-fadeIn" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-0 grid place-items-center p-0 sm:p-6 pointer-events-none">
        <div className="anim-scaleIn pointer-events-auto relative w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[88vh] bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden flex flex-col sm:flex-row">

          {/* image */}
          <div className="relative sm:w-[58%] shrink-0 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
            <img
              src={image.image_url}
              alt={image.effective_prompt || image.prompt}
              className="w-full h-auto object-contain sm:h-full sm:w-auto max-h-[40vh] sm:max-h-full anim-reveal"
              style={{ minHeight: '14rem' }}
            />
          </div>

          {/* detail pane */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 overflow-y-auto thin-scroll p-5 sm:p-6 space-y-4">

              {/* prompt */}
              <p dir="auto" className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 font-medium">
                {image.prompt}
              </p>

              {/* translation */}
              {image.was_translated && image.effective_prompt && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/25 px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-300 mb-1">
                    ✦ {t('translatedTo')}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-200" dir="ltr">
                    {image.effective_prompt}
                  </p>
                </div>
              )}

              {/* tags */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                  {t('tagsLabel')}
                </p>
                <TagEditor image={image} />
              </div>

              {/* meta badges */}
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-indigo">{image.size}</span>
                <span className="badge badge-violet">{t('qualityLabel')}: {image.quality}</span>
                <span className="badge badge-fuchsia">bg: {image.background}</span>
                <span className="badge badge-slate">{image.output_format?.toUpperCase()}</span>
                {image.cost_usd > 0 && (
                  <span className="badge badge-emerald">≈ ${image.cost_usd.toFixed(3)}</span>
                )}
              </div>

              {/* metadata */}
              <dl className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
                <dt className="text-slate-400 dark:text-slate-500">{t('createdLabel')}</dt>
                <dd className="text-slate-700 dark:text-slate-200 text-end font-mono text-xs">{formattedDate}</dd>
                {image.file_size > 0 && <>
                  <dt className="text-slate-400 dark:text-slate-500">{t('fileSizeLabel')}</dt>
                  <dd className="text-slate-700 dark:text-slate-200 text-end font-mono text-xs">
                    {(image.file_size / 1024).toFixed(1)} KB
                  </dd>
                </>}
              </dl>
            </div>

            {/* actions */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 gap-2.5">
              <DownloadButton imageUrl={image.image_url} filename={downloadName} />
              <ShareButton imageUrl={image.image_url} prompt={image.prompt} />
              {onRegenerate && (
                <ActionButton
                  onClick={() => onRegenerate(image)}
                  disabled={regenerating || deleting}
                  variant="primary"
                >
                  {regenerating ? (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="h-3.5 w-3.5">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  )}
                  {regenerating ? t('generating') : t('regenSimilar')}
                </ActionButton>
              )}
              {onDelete && <DeleteButton onConfirm={() => onDelete(image)} disabled={deleting} />}
            </div>
          </div>

          {/* close */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeLabel')}
            className="absolute top-3 end-3 grid place-items-center h-9 w-9 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-[18px] w-[18px]">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
