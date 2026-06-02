import { useState } from 'react';

const SIZES = [
  { value: 'auto', label: 'Auto (let the model choose)' },
  { value: '1024x1024', label: 'Square (1024×1024)' },
  { value: '1024x1536', label: 'Portrait (1024×1536)' },
  { value: '1536x1024', label: 'Landscape (1536×1024)' },
];

const QUALITIES = [
  { value: 'auto', label: 'Auto' },
  { value: 'low', label: 'Low — fastest, cheapest' },
  { value: 'medium', label: 'Medium — balanced' },
  { value: 'high', label: 'High — best quality' },
];

const BACKGROUNDS = [
  { value: 'auto', label: 'Auto' },
  { value: 'opaque', label: 'Opaque' },
  { value: 'transparent', label: 'Transparent (PNG/WebP only)' },
];

const FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
];

function Select({ label, value, onChange, options, disabled }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-field cursor-pointer pr-8"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AdvancedOptions({ values, onChange, disabled }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium
                   text-slate-700 dark:text-slate-200"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="h-4 w-4">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Advanced options
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Size"
              value={values.size}
              onChange={(v) => onChange({ ...values, size: v })}
              options={SIZES}
              disabled={disabled}
            />
            <Select
              label="Quality"
              value={values.quality}
              onChange={(v) => onChange({ ...values, quality: v })}
              options={QUALITIES}
              disabled={disabled}
            />
            <Select
              label="Background"
              value={values.background}
              onChange={(v) => onChange({ ...values, background: v })}
              options={BACKGROUNDS}
              disabled={disabled}
            />
            <Select
              label="Output format"
              value={values.output_format}
              onChange={(v) => onChange({ ...values, output_format: v })}
              options={FORMATS}
              disabled={disabled}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-50/60 px-3 py-2
                            dark:bg-amber-950/20">
            <input
              type="checkbox"
              checked={values.force}
              onChange={(e) => onChange({ ...values, force: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">
              Force re-generation (bypass cache — costs API credits)
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
