export default function ErrorMessage({ message }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm
                 text-red-800 animate-fade-in dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
           className="mt-0.5 h-5 w-5 flex-shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-0.5 opacity-90">{message}</p>
      </div>
    </div>
  );
}
