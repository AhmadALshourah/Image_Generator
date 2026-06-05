interface Props {
  name: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export default function TagChip({ name, count, active, onClick, onRemove }: Props) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      className={`chip ${active ? 'chip-active' : 'chip-inactive'} ${onClick ? 'cursor-pointer' : ''}`}
      style={active ? { backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' } : {}}
    >
      <span>#{name}</span>
      {typeof count === 'number' && (
        <span className="opacity-60">· {count}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove tag ${name}`}
          className="grid place-items-center h-5 w-5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 ms-0.5"
        >
          ×
        </button>
      )}
    </span>
  );
}
