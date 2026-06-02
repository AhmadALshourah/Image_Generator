export default function ActionButton({
  onClick,
  children,
  variant = 'secondary',
  disabled = false,
  type = 'button',
  title,
  className = '',
}) {
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 shadow-md shadow-indigo-500/20'
      : variant === 'danger'
      ? 'border border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition
                  active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
