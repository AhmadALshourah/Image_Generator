import { useStatsQuery } from '../api/queries';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

const PALETTE = ['var(--brand-1)', 'var(--brand-2)', 'var(--brand-soft)', '#a78bfa'];

function StatCard({
  label, value, hint, accent, icon, index = 0,
}: {
  label: string; value: string; hint?: string;
  accent: 'indigo' | 'violet' | 'emerald' | 'amber';
  icon: React.ReactNode; index?: number;
}) {
  const ring = { indigo: 'ring-indigo-200/60 dark:ring-indigo-500/20', violet: 'ring-violet-200/60 dark:ring-violet-500/20', emerald: 'ring-emerald-200/60 dark:ring-emerald-500/20', amber: 'ring-amber-200/60 dark:ring-amber-500/20' }[accent];
  const grad = { indigo: 'from-indigo-500/15 to-indigo-500/5', violet: 'from-violet-500/15 to-violet-500/5', emerald: 'from-emerald-500/15 to-emerald-500/5', amber: 'from-amber-500/15 to-amber-500/5' }[accent];
  const iconColor = { indigo: 'text-indigo-600 dark:text-indigo-300', violet: 'text-violet-600 dark:text-violet-300', emerald: 'text-emerald-600 dark:text-emerald-300', amber: 'text-amber-600 dark:text-amber-300' }[accent];

  return (
    <div className={`anim-fadeUp relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} ring-1 ${ring} bg-white dark:bg-slate-900 p-5`}
      style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`opacity-80 ${iconColor}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function BarChart({ data, noDataLabel }: { data: { day: string; cost_usd: number; images: number }[]; noDataLabel: string }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">{noDataLabel}</p>;
  }
  const maxCost = Math.max(...data.map((d) => d.cost_usd), 0.0001);
  return (
    <div className="space-y-1.5 max-h-[22rem] overflow-y-auto thin-scroll pe-1">
      {data.slice(-30).map((d, i) => {
        const pct = Math.max(d.cost_usd > 0 ? 8 : 0, (d.cost_usd / maxCost) * 100);
        return (
          <div key={d.day} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs font-mono text-slate-400 dark:text-slate-500">{d.day}</span>
            <div className="flex-1 h-6 rounded-md bg-slate-100 dark:bg-slate-800/60 overflow-hidden relative">
              <div className="h-full rounded-md flex items-center transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', transitionDelay: `${i * 12}ms` }}>
                {d.cost_usd > 0 && (
                  <span className="text-[10px] font-semibold text-white/95 px-2 whitespace-nowrap">
                    {formatUsd(d.cost_usd)} · {d.images} img
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Distribution({ title, data, delay = '0s', noDataLabel }: {
  title: string; data: Record<string, number>; delay?: string; noDataLabel: string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-5 sm:p-6 anim-fadeUp" style={{ animationDelay: delay }}>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      <div className="space-y-3.5">
        {entries.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{noDataLabel}</p>}
        {entries.map(([key, value], i) => {
          const pct = total === 0 ? 0 : Math.round((value / total) * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-mono">{key}</span>
                <span className="text-slate-400 dark:text-slate-500 tabular-nums">{value} · {pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length], transitionDelay: `${i * 80}ms` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { t } = useLang();
  const { isAdmin } = useAuth();
  const { data, isLoading, error } = useStatsQuery();

  if (isLoading && !data) return (
    <main className="max-w-6xl mx-auto px-4 py-12"><div className="card"><LoadingSpinner /></div></main>
  );
  if (error) return (
    <main className="max-w-6xl mx-auto px-4 py-12"><ErrorMessage message={(error as Error).message} /></main>
  );
  if (!data) return null;

  const approxSaved = data.cached_count > 0
    ? t('approxSaved').replace('${amount}', formatUsd(data.cached_count * 0.04))
    : undefined;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 anim-fadeUp">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {t('usageCost')}
          </h1>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isAdmin
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
          }`}>
            {isAdmin ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            )}
            {isAdmin ? t('statsAdminBadge') : t('statsUserBadge')}
          </span>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('usageSub')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard index={0} accent="indigo"  label={t('imagesGen')}      value={String(data.total_images)}         icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>} />
        <StatCard index={1} accent="violet"  label={t('totalSpend')}     value={formatUsd(data.total_cost_usd)}    hint={t('usdEstimated')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>} />
        <StatCard index={2} accent="emerald" label={t('cacheHits')}      value={String(data.cached_count)}         hint={approxSaved} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>} />
        <StatCard index={3} accent="amber"   label={t('autoTranslated')} value={String(data.translated_count)}     hint={t('arToEn')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>} />
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-5 sm:p-6 mb-6 anim-fadeUp" style={{ animationDelay: '.1s' }}>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">{t('dailySpend')}</h3>
        <BarChart data={data.by_day} noDataLabel={t('noDataGen')} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Distribution title={t('byQuality')} data={data.by_quality} delay=".12s" noDataLabel={t('noData')} />
        <Distribution title={t('bySize')}    data={data.by_size}    delay=".18s" noDataLabel={t('noData')} />
      </div>
    </main>
  );
}
