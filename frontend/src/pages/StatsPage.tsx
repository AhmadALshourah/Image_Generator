import { useStatsQuery } from '../api/queries';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: 'indigo' | 'violet' | 'emerald' | 'amber';
}) {
  const accentBg = {
    indigo: 'from-indigo-100 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-950/20',
    violet: 'from-violet-100 to-violet-50 dark:from-violet-950/40 dark:to-violet-950/20',
    emerald: 'from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-950/20',
    amber: 'from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-950/20',
  }[accent];

  return (
    <div className={`card bg-gradient-to-br ${accentBg}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold leading-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { day: string; cost_usd: number; images: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        No data yet — generate an image first.
      </p>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.cost_usd), 0.0001);
  const days = data.slice(-30); // last 30 days

  return (
    <div className="space-y-1.5">
      {days.map((d) => {
        const widthPct = Math.max(2, (d.cost_usd / maxCost) * 100);
        return (
          <div key={d.day} className="flex items-center gap-3 text-xs">
            <span className="w-20 flex-shrink-0 font-mono text-slate-500 dark:text-slate-500">
              {d.day}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-900">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 dark:from-indigo-500 dark:to-violet-500"
                style={{ width: `${widthPct}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-semibold text-slate-700 dark:text-white">
                {formatUsd(d.cost_usd)} · {d.images} img
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Distribution({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  return (
    <div className="card">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {entries.length === 0 && (
          <li className="text-xs text-slate-500 dark:text-slate-400">No data yet.</li>
        )}
        {entries.map(([key, value]) => {
          const pct = total === 0 ? 0 : (value / total) * 100;
          return (
            <li key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{key}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {value} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-violet-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function StatsPage() {
  const { data, isLoading, error } = useStatsQuery();

  if (isLoading && !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="card">
          <LoadingSpinner />
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <ErrorMessage message={(error as Error).message} />
      </main>
    );
  }
  if (!data) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Usage & cost</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Estimated API spend computed from gpt-image-1's published pricing — for visibility only,
          not billing.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Images generated"
          value={String(data.total_images)}
          accent="indigo"
        />
        <StatCard
          label="Total spend"
          value={formatUsd(data.total_cost_usd)}
          hint="USD, estimated"
          accent="violet"
        />
        <StatCard
          label="Cache hits"
          value={String(data.cached_count)}
          hint={data.cached_count > 0 ? `≈ ${formatUsd(data.cached_count * 0.04)} saved` : undefined}
          accent="emerald"
        />
        <StatCard
          label="Auto-translated"
          value={String(data.translated_count)}
          hint="Arabic → English"
          accent="amber"
        />
      </section>

      <section className="card mb-6">
        <h3 className="mb-4 text-sm font-semibold">Daily spend (last 30 days)</h3>
        <BarChart data={data.by_day} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Distribution title="By quality" data={data.by_quality} />
        <Distribution title="By size" data={data.by_size} />
      </section>
    </main>
  );
}
