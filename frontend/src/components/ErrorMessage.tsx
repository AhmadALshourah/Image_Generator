import { useLang } from '../context/LangContext';

export interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  const { t } = useLang();
  return (
    <div role="alert"
      className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200 dark:ring-red-500/25 px-4 py-3 text-sm anim-fadeIn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="mt-0.5 h-5 w-5 shrink-0 text-red-500">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p className="font-semibold text-red-800 dark:text-red-300">{t('somethingWrong')}</p>
        <p className="mt-0.5 text-red-700 dark:text-red-400 opacity-90">{message}</p>
      </div>
    </div>
  );
}
