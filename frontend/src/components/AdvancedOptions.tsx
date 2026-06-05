import { useState } from 'react';
import { useLang } from '../context/LangContext';
import type { ImageBackground, ImageOutputFormat, ImageQuality, ImageSize } from '../types/api';

export interface AdvancedOptionsValues {
  size: ImageSize;
  quality: ImageQuality;
  background: ImageBackground;
  output_format: ImageOutputFormat;
  force: boolean;
}

export interface AdvancedOptionsProps {
  values: AdvancedOptionsValues;
  onChange: (next: AdvancedOptionsValues) => void;
  disabled?: boolean;
}

const SIZES: Array<{ value: ImageSize; label: string }> = [
  { value: '1024x1024', label: '1024×1024' },
  { value: '1024x1536', label: '1024×1536' },
  { value: '1536x1024', label: '1536×1024' },
  { value: 'auto',      label: 'auto' },
];

const QUALITIES: Array<{ value: ImageQuality; label: string }> = [
  { value: 'auto',   label: 'auto' },
  { value: 'low',    label: 'low' },
  { value: 'medium', label: 'medium' },
  { value: 'high',   label: 'high' },
];

const BACKGROUNDS: Array<{ value: ImageBackground; label: string }> = [
  { value: 'auto',        label: 'auto' },
  { value: 'transparent', label: 'transparent' },
  { value: 'opaque',      label: 'opaque' },
];

const FORMATS: Array<{ value: ImageOutputFormat; label: string }> = [
  { value: 'png',  label: 'png' },
  { value: 'jpeg', label: 'jpeg' },
  { value: 'webp', label: 'webp' },
];

const selectCls =
  'h-10 rounded-lg bg-slate-50 dark:bg-slate-950/50 ring-1 ring-slate-200 dark:ring-slate-800 ' +
  'px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 w-full';

export default function AdvancedOptions({ values, onChange, disabled }: AdvancedOptionsProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  const selects = [
    { key: 'size' as const,          labelKey: 'sizeLabel',    opts: SIZES },
    { key: 'quality' as const,       labelKey: 'qualityLabel', opts: QUALITIES },
    { key: 'background' as const,    labelKey: 'bgLabel',      opts: BACKGROUNDS },
    { key: 'output_format' as const, labelKey: 'formatLabel',  opts: FORMATS },
  ];

  return (
    <div className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {t('advanced')}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`h-[18px] w-[18px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="anim-fadeUp px-4 pb-4 pt-1 grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-800">
          {selects.map((s) => (
            <label key={s.key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t(s.labelKey)}</span>
              <select
                value={values[s.key] as string}
                onChange={(e) => onChange({ ...values, [s.key]: e.target.value })}
                disabled={disabled}
                className={selectCls}
                style={{ '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
              >
                {s.opts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          ))}

          <label className="col-span-2 flex items-center gap-2.5 mt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={values.force}
              onChange={(e) => onChange({ ...values, force: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 rounded"
              style={{ accentColor: 'var(--brand-1)' }}
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">{t('forceRegen')}</span>
          </label>
        </div>
      )}
    </div>
  );
}
