import type { ImageRecord } from '../types/api';

export interface ImageCardProps {
  image: ImageRecord;
  onClick?: (image: ImageRecord) => void;
}

export default function ImageCard({ image, onClick }: ImageCardProps) {
  const aspectClass =
    image.size === '1024x1536'
      ? 'aspect-[1024/1536]'
      : image.size === '1536x1024'
      ? 'aspect-[1536/1024]'
      : 'aspect-square';

  const formattedDate = new Date(image.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const previewUrl = image.thumbnail_url || image.image_url;

  const sizeLabel =
    image.size === '1024x1024'
      ? 'Square'
      : image.size === '1024x1536'
      ? 'Portrait'
      : image.size === '1536x1024'
      ? 'Landscape'
      : 'Auto';

  return (
    <button
      type="button"
      onClick={() => onClick?.(image)}
      className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left
                 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/30
                 focus:outline-none focus:ring-2 focus:ring-indigo-500
                 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/50"
    >
      <div className={`overflow-hidden bg-slate-100 dark:bg-slate-800 ${aspectClass}`}>
        <img
          src={previewUrl}
          alt={image.prompt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-slate-800 dark:text-slate-200"
           dir="auto">
          {image.prompt}
        </p>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
          <span>{formattedDate}</span>
          <div className="flex items-center gap-1">
            {image.was_translated && (
              <span title="Auto-translated from another language"
                    className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                AR→EN
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {sizeLabel}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
