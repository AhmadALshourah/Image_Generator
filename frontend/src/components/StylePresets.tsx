interface Preset {
  id: string;
  label: string;
  emoji: string;
  suffix: string;
}

const PRESETS: Preset[] = [
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    emoji: '📷',
    suffix: ', photorealistic, sharp focus, 50mm lens, natural lighting, ultra-detailed',
  },
  {
    id: 'anime',
    label: 'Anime',
    emoji: '🎌',
    suffix: ', anime style, cel shading, vibrant colors, detailed line art',
  },
  {
    id: 'oil',
    label: 'Oil Painting',
    emoji: '🖼️',
    suffix: ', oil painting, visible brushstrokes, rich impasto texture, classical composition',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    emoji: '🎨',
    suffix: ', watercolor painting, soft washes, flowing pigments, paper texture',
  },
  {
    id: 'pixel',
    label: 'Pixel Art',
    emoji: '👾',
    suffix: ', pixel art, 16-bit, vibrant palette, retro game aesthetic',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    emoji: '🎬',
    suffix: ', cinematic, dramatic lighting, shallow depth of field, color graded',
  },
  {
    id: 'ghibli',
    label: 'Studio Ghibli',
    emoji: '🍃',
    suffix: ', Studio Ghibli style, soft pastel colors, hand-painted backgrounds, whimsical',
  },
  {
    id: '3d',
    label: '3D Render',
    emoji: '🧊',
    suffix: ', 3D render, octane, ray-traced lighting, smooth surfaces, physically based',
  },
];

export interface StylePresetsProps {
  onApply: (suffix: string) => void;
  disabled?: boolean;
}

/**
 * Quick-apply style suffixes. Click a chip to append a ready-made phrase
 * to the prompt — lowers the skill floor for non-prompt-engineers.
 */
export default function StylePresets({ onApply, disabled }: StylePresetsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="self-center text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
        Style:
      </span>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApply(preset.suffix)}
          disabled={disabled}
          title={`Append: "${preset.suffix.trim().slice(2)}"`}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700
                     transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700
                     disabled:cursor-not-allowed disabled:opacity-50
                     dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300
                     dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
        >
          <span aria-hidden>{preset.emoji}</span>
          {preset.label}
        </button>
      ))}
    </div>
  );
}
