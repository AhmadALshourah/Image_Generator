export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-pulse-slow rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20" />
        <svg
          className="absolute inset-0 h-16 w-16 animate-spin text-indigo-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
          <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conjuring your image... this can take 15–30 seconds.
      </p>
    </div>
  );
}
