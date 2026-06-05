import { Link } from 'react-router-dom';

import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DownloadButton from './DownloadButton';
import ShareButton from './ShareButton';
import TagChip from './TagChip';
import { useLang } from '../context/LangContext';
import type { ImageRecord } from '../types/api';

export interface ImageDisplayProps {
  result: ImageRecord | null;
  loading: boolean;
  error: string | null;
}

function IconImage({ size = 34 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }} className="text-slate-300 dark:text-slate-600">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function IconArrowRight({ size = 15 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconGrid({ size = 17 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function EmptyState() {
  const { t } = useLang();
  return (
    <div className="min-h-[28rem] flex flex-col items-center justify-center text-center">
      <div className="relative grid place-items-center h-20 w-20 rounded-2xl bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 mb-5">
        <div
          className="absolute inset-0 rounded-2xl opacity-10"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }}
        />
        <IconImage size={34} />
      </div>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs">{t('emptyTitle')}</p>
      <Link
        to="/gallery"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:gap-2.5 transition-all"
        style={{ color: 'var(--brand-1)' }}
      >
        {t('emptyLink')} <IconArrowRight size={15} />
      </Link>
    </div>
  );
}

export default function ImageDisplay({ result, loading, error }: ImageDisplayProps) {
  const { t } = useLang();
  const ext = result?.output_format === 'jpeg' ? 'jpg' : result?.output_format || 'png';
  const downloadName = result?.uuid ? `gpt-image-${result.uuid.slice(0, 8)}.${ext}` : `image.${ext}`;

  return (
    <div className="card">
      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && !result && <EmptyState />}

      {!loading && !error && result && (
        <div className="space-y-4 anim-fadeUp">
          {/* image */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 bg-slate-100 dark:bg-slate-950">
            <img
              src={result.image_url}
              alt={result.effective_prompt || result.prompt}
              className="h-full w-full object-cover anim-reveal"
              loading="lazy"
            />
            {result.cached && (
              <div className="absolute top-3 end-3">
                <span className="badge badge-amber">{t('cachedBadge')}</span>
              </div>
            )}
            <div className="absolute top-3 start-3">
              <span className="badge badge-emerald">
                <IconCheck size={12} /> {t('savedBadge')}
              </span>
            </div>
          </div>

          {/* meta badges */}
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-indigo">{result.size}</span>
            <span className="badge badge-violet">{t('qualityLabel')}: {result.quality}</span>
            <span className="badge badge-fuchsia">bg: {result.background}</span>
            {result.cost_usd > 0 && (
              <span className="badge badge-emerald">≈ ${result.cost_usd.toFixed(3)}</span>
            )}
          </div>

          {/* tags */}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('tagsLabel')}:
              </span>
              {result.tags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} />
              ))}
            </div>
          )}

          {/* translation */}
          {result.was_translated && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/25 px-4 py-3">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-300 mb-1">
                ✦ {t('translatedTo')}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-200" dir="ltr">
                {result.effective_prompt}
              </p>
            </div>
          )}

          {/* actions */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <DownloadButton imageUrl={result.image_url} filename={downloadName} />
            <ShareButton imageUrl={result.image_url} prompt={result.prompt} />
            <Link to="/gallery" className="btn-outline">
              <IconGrid size={17} />
              {t('viewGallery')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
