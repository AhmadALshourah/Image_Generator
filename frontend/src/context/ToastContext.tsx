import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastApi {
  show: (message: string, opts?: ToastOptions) => number;
  dismiss: (id: number) => void;
  success: (message: string, opts?: Omit<ToastOptions, 'type'>) => number;
  error: (message: string, opts?: Omit<ToastOptions, 'type'>) => number;
  info: (message: string, opts?: Omit<ToastOptions, 'type'>) => number;
}

const ToastContext = createContext<ToastApi | null>(null);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, { type = 'info', duration = 3500 }: ToastOptions = {}): number => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api: ToastApi = {
    show,
    dismiss,
    success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
    error:   (msg, opts) => show(msg, { ...opts, type: 'error' }),
    info:    (msg, opts) => show(msg, { ...opts, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-20 inset-x-0 sm:inset-x-auto sm:end-6 z-50 flex flex-col items-center sm:items-end gap-2.5 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const RING: Record<ToastType, string> = {
  success: 'ring-emerald-200 dark:ring-emerald-500/30',
  error:   'ring-red-200 dark:ring-red-500/30',
  info:    'ring-slate-200 dark:ring-slate-700',
};

const DOT_COLOR: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error:   'text-red-500',
  info:    'text-slate-400',
};

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="h-4 w-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="h-4 w-4">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  ),
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(toast.id); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss, toast.id]);

  return (
    <div
      role="status"
      className={`anim-slideIn pointer-events-auto flex items-center gap-3 max-w-sm w-full
                  rounded-xl bg-white dark:bg-slate-900 ring-1 ${RING[toast.type]}
                  shadow-xl shadow-black/10 dark:shadow-black/40 px-4 py-3`}
    >
      <span className={`grid place-items-center h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-800 shrink-0 ${DOT_COLOR[toast.type]}`}>
        {ICONS[toast.type]}
      </span>
      <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 leading-snug">
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ms-1 shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="h-[15px] w-[15px]">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
