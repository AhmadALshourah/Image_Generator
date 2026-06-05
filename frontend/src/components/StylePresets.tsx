import { useState } from 'react';
import { useLang } from '../context/LangContext';

interface Preset {
  id: string;
  labelKey: string;
  suffix: string;
}

const PRESETS: Preset[] = [
  { id: 'photo',  labelKey: 'presetPhoto',  suffix: ', photorealistic, sharp focus, 50mm lens, natural lighting, ultra-detailed' },
  { id: 'anime',  labelKey: 'presetAnime',  suffix: ', anime style, cel shading, vibrant colors, detailed line art' },
  { id: 'oil',    labelKey: 'presetOil',    suffix: ', oil painting, visible brushstrokes, rich impasto texture, classical composition' },
  { id: 'water',  labelKey: 'presetWater',  suffix: ', watercolor painting, soft washes, flowing pigments, paper texture' },
  { id: 'pixel',  labelKey: 'presetPixel',  suffix: ', pixel art, 16-bit, vibrant palette, retro game aesthetic' },
  { id: 'cinema', labelKey: 'presetCinema', suffix: ', cinematic, dramatic lighting, shallow depth of field, color graded' },
  { id: 'ghibli', labelKey: 'presetGhibli', suffix: ', Studio Ghibli style, soft pastel colors, hand-painted backgrounds, whimsical' },
  { id: '3d',     labelKey: 'preset3D',     suffix: ', 3D render, octane, ray-traced lighting, smooth surfaces, physically based' },
];

export interface StylePresetsProps {
  /** Called whenever the set of active style suffixes changes. */
  onChange: (suffixes: string[]) => void;
  disabled?: boolean;
}

export default function StylePresets({ onChange, disabled }: StylePresetsProps) {
  const { t } = useLang();
  const [active, setActive] = useState<string[]>([]);

  const toggle = (preset: Preset) => {
    if (disabled) return;
    setActive((prev) => {
      const next = prev.includes(preset.id)
        ? prev.filter((x) => x !== preset.id)
        : [...prev, preset.id];
      // Notify parent with the current suffixes (in selection order)
      onChange(next.map((id) => PRESETS.find((p) => p.id === id)!.suffix));
      return next;
    });
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-violet-900/70 mb-2">
        {t('styles')}
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const isActive = active.includes(preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => toggle(preset)}
              disabled={disabled}
              className={`chip ${isActive ? 'chip-active' : 'chip-inactive'} disabled:cursor-not-allowed disabled:opacity-50`}
              style={isActive ? { backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' } : {}}
            >
              {t(preset.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
