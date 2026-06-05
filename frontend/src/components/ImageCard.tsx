import { useLang } from '../context/LangContext';
import type { ImageRecord } from '../types/api';

export interface ImageCardProps {
  image: ImageRecord;
  onClick?: (image: ImageRecord) => void;
}

export default function ImageCard({ image, onClick }: ImageCardProps) {
  const { t, lang } = useLang();

  const aspectClass =
    image.size === '1024x1536' ? 'aspect-[4/5]' :
    image.size === '1536x1024' ? 'aspect-[16/10]' :
    'aspect-square';

  const formattedDate = new Date(image.created_at).toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : undefined,
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  const previewUrl = image.thumbnail_url || image.image_url;

  return (
    <button
      type="button"
      onClick={() => onClick?.(image)}
      className="group text-start anim-fadeUp focus:outline-none"
    >
      <div className={`relative ${aspectClass} w-full rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm group-hover:shadow-xl group-hover:shadow-slate-300/40 dark:group-hover:shadow-black/50 transition-all duration-300 group-hover:-translate-y-1`}>
        <img
          src={previewUrl}
          alt={image.prompt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {image.cached && (
          <span className="absolute top-2 end-2">
            <span className="badge badge-amber">{t('cachedBadge')}</span>
          </span>
        )}
      </div>
      <div className="px-0.5 pt-2.5">
        <p dir="auto" className="text-sm text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
          {image.prompt}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>{formattedDate}</span>
          {image.was_translated && <span className="badge badge-amber">AR→EN</span>}
          <span className="ms-auto font-mono">{image.size}</span>
        </div>
      </div>
    </button>
  );
}
