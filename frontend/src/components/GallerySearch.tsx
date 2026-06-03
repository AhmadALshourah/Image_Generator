import { useTagsQuery } from '../api/queries';
import TagChip from './TagChip';
import type { GalleryFilters } from '../types/api';

const SIZE_OPTIONS = [
  { value: '', label: 'Any size' },
  { value: '1024x1024', label: 'Square' },
  { value: '1024x1536', label: 'Portrait' },
  { value: '1536x1024', label: 'Landscape' },
  { value: 'auto', label: 'Auto' },
];

const QUALITY_OPTIONS = [
  { value: '', label: 'Any quality' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'auto', label: 'Auto' },
];

const BACKGROUND_OPTIONS = [
  { value: '', label: 'Any background' },
  { value: 'auto', label: 'Auto' },
  { value: 'opaque', label: 'Opaque' },
  { value: 'transparent', label: 'Transparent' },
];

interface MiniSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  disabled?: boolean;
}

function MiniSelect({ value, onChange, options, disabled }: MiniSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700
                 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export interface GallerySearchProps {
  filters: GalleryFilters;
  onChange: (next: GalleryFilters) => void;
  disabled?: boolean;
  resultCount?: number;
}

export default function GallerySearch({ filters, onChange, disabled, resultCount }: GallerySearchProps) {
  const { q = '', size = '', quality = '', background = '', tag = '' } = filters;

  const tagsQuery = useTagsQuery();
  const tagItems = tagsQuery.data?.items ?? [];

  const hasActiveFilter = Boolean(q || size || quality || background || tag);
  const clear = () => onChange({ q: '', size: '', quality: '', background: '', tag: '' });

  return (
    <div className="card mb-6 space-y-3">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search by prompt..."
          disabled={disabled}
          dir="auto"
          className="input-field pl-10"
        />
        {q && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, q: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700
                       dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MiniSelect
          value={size}
          onChange={(v) => onChange({ ...filters, size: v })}
          options={SIZE_OPTIONS}
          disabled={disabled}
        />
        <MiniSelect
          value={quality}
          onChange={(v) => onChange({ ...filters, quality: v })}
          options={QUALITY_OPTIONS}
          disabled={disabled}
        />
        <MiniSelect
          value={background}
          onChange={(v) => onChange({ ...filters, background: v })}
          options={BACKGROUND_OPTIONS}
          disabled={disabled}
        />

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clear}
            className="ml-auto text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Clear filters
          </button>
        )}

        {!hasActiveFilter && typeof resultCount === 'number' && (
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-500">
            {resultCount} total
          </span>
        )}
        {hasActiveFilter && typeof resultCount === 'number' && (
          <span className="text-xs text-slate-500 dark:text-slate-500">
            {resultCount} match{resultCount === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      {tagItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-3 dark:border-slate-800">
          <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
            Tags:
          </span>
          {tagItems.slice(0, 20).map((t) => (
            <TagChip
              key={t.id}
              name={t.name}
              count={t.image_count}
              active={tag === t.name}
              onClick={() => onChange({ ...filters, tag: tag === t.name ? '' : t.name })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
