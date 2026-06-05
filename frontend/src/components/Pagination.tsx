import { useLang } from '../context/LangContext';

export interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onChange?: (nextOffset: number) => void;
  disabled?: boolean;
}

function IconChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function Pagination({ total, limit, offset, onChange, disabled }: PaginationProps) {
  const { t, isRtl } = useLang();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const goTo = (page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    onChange?.((clamped - 1) * limit);
  };

  if (total <= limit) return null;

  const showingLabel = t('showingFmt')
    .replace('{from}', String(offset + 1))
    .replace('{to}', String(Math.min(offset + limit, total)))
    .replace('{total}', String(total));

  const pageLabel = t('pageOf')
    .replace('{page}', String(currentPage))
    .replace('{total}', String(totalPages));

  // In RTL, "previous" moves to higher page numbers visually (right side)
  const PrevIcon = isRtl ? IconChevronRight : IconChevronLeft;
  const NextIcon = isRtl ? IconChevronLeft : IconChevronRight;

  return (
    <div className="mt-8 flex items-center justify-between">
      <p className="text-sm text-slate-400 dark:text-slate-500">{showingLabel}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className="btn-outline h-9 px-3 text-sm gap-1.5"
        >
          <PrevIcon size={16} /> {t('prev')}
        </button>
        <span className="text-sm font-mono text-slate-500 dark:text-slate-400 px-1">{pageLabel}</span>
        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          className="btn-outline h-9 px-3 text-sm gap-1.5"
        >
          {t('next')} <NextIcon size={16} />
        </button>
      </div>
    </div>
  );
}
