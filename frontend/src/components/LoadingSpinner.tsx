import { useLang } from '../context/LangContext';

export default function LoadingSpinner() {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative" style={{ width: 56, height: 56 }}>
        <div className="absolute inset-0 rounded-full blur-md opacity-50"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }} />
        <div className="absolute inset-0 rounded-full"
          style={{ background: 'conic-gradient(from 0deg, transparent, var(--brand-1), var(--brand-2))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)' }} />
        <div className="spin absolute inset-0 rounded-full"
          style={{ background: 'conic-gradient(from 0deg, transparent 70%, var(--brand-2))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)' }} />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('loadingImg')}</p>
    </div>
  );
}
