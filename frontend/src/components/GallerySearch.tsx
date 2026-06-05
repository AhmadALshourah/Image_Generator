import { useTagsQuery } from '../api/queries';
import TagChip from './TagChip';
import { useLang } from '../context/LangContext';
import type { GalleryFilters } from '../types/api';

export interface GallerySearchProps {
  filters: GalleryFilters;
  onChange: (next: GalleryFilters) => void;
  disabled?: boolean;
  resultCount?: number;
}

const selectCls =
  'h-9 rounded-lg bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 ' +
  'px-3 text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2';

export default function GallerySearch({ filters, onChange, disabled, resultCount }: GallerySearchProps) {
  const { t } = useLang();
  const { q = '', size = '', quality = '', background = '', tag = '' } = filters;

  const tagsQuery = useTagsQuery();
  const tagItems = tagsQuery.data?.items ?? [];

  const hasActiveFilter = Boolean(q || size || quality || background || tag);
  const clear = () => onChange({ q: '', size: '', quality: '', background: '', tag: '' });

  const sizeOptions    = [{ v: '', l: t('anySize') },    { v: '1024x1024', l: '1024×1024' }, { v: '1024x1536', l: '1024×1536' }, { v: '1536x1024', l: '1536×1024' }, { v: 'auto', l: 'auto' }];
  const qualityOptions = [{ v: '', l: t('anyQuality') }, { v: 'high', l: 'high' }, { v: 'medium', l: 'medium' }, { v: 'auto', l: 'auto' }, { v: 'low', l: 'low' }];
  const bgOptions      = [{ v: '', l: t('anyBg') },      { v: 'auto', l: 'auto' }, { v: 'transparent', l: 'transparent' }, { v: 'opaque', l: 'opaque' }];

  const countLabel = hasActiveFilter
    ? t('nMatches').replace('{n}', String(resultCount ?? 0))
    : t('nTotal').replace('{n}', String(resultCount ?? 0));

  return (
    <div className="card mb-6 space-y-3">
      {/* search input */}
      <div className="relative">
        <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="h-[18px] w-[18px]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder={t('searchPh')}
          disabled={disabled}
          dir="auto"
          className="input-field ps-11 pe-10 h-11"
        />
        {q && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, q: '' })}
            aria-label="Clear"
            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* filter row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {([
          { value: size,       opts: sizeOptions,    key: 'size' },
          { value: quality,    opts: qualityOptions, key: 'quality' },
          { value: background, opts: bgOptions,      key: 'background' },
        ] as const).map(({ value, opts, key }) => (
          <select
            key={key}
            value={value}
            onChange={(e) => onChange({ ...filters, [key]: e.target.value })}
            disabled={disabled}
            className={selectCls}
            style={{ '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
          >
            {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}

        <span className="text-sm text-slate-400 dark:text-slate-500 ms-1">{countLabel}</span>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clear}
            className="ms-auto text-sm font-semibold hover:underline"
            style={{ color: 'var(--brand-1)' }}
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* tag chips */}
      {tagItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
          {tagItems.slice(0, 20).map((tg) => (
            <TagChip
              key={tg.id}
              name={tg.name}
              count={tg.image_count}
              active={tag === tg.name}
              onClick={() => onChange({ ...filters, tag: tag === tg.name ? '' : tg.name })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
