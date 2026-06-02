export default function Pagination({ total, limit, offset, onChange, disabled }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const goTo = (page) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    onChange?.((clamped - 1) * limit);
  };

  if (total <= limit) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Showing <span className="font-medium text-slate-700 dark:text-slate-300">{offset + 1}</span>–
        <span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(offset + limit, total)}</span>{' '}
        of <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition
                     hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50
                     dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ‹ Prev
        </button>

        <span className="px-2 text-xs text-slate-600 dark:text-slate-400">
          Page <span className="font-semibold">{currentPage}</span> / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition
                     hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50
                     dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
