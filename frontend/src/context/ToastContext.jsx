import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { type = 'info', duration = 3500 } = {}) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    show,
    dismiss,
    success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => show(msg, { ...opts, type: 'error' }),
    info: (msg, opts) => show(msg, { ...opts, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const TYPE_STYLES = {
  success:
    'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-100 dark:border-emerald-900/60',
  error:
    'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/70 dark:text-red-100 dark:border-red-900/60',
  info: 'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-900/80 dark:text-slate-100 dark:border-slate-700',
};

const ICONS = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="h-4 w-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

function ToastItem({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onDismiss(toast.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss, toast.id]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm
                  ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}
                  ${leaving ? 'opacity-0 translate-y-[-6px]' : 'animate-slide-up'}
                  transition-all duration-200`}
    >
      <span className="mt-0.5 flex-shrink-0">{ICONS[toast.type] || ICONS.info}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => {
          setLeaving(true);
          setTimeout(() => onDismiss(toast.id), 180);
        }}
        className="text-current opacity-60 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="h-4 w-4">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
