import { useEffect, useState, type KeyboardEvent } from 'react';

import TagChip from './TagChip';
import { useSetImageTags } from '../api/queries';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';
import type { ImageRecord, TagSummary } from '../types/api';

export interface TagEditorProps {
  image: ImageRecord;
  readOnly?: boolean;
}

function dedupe(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = t.trim().toLowerCase();
    if (n && !seen.has(n)) { seen.add(n); out.push(n); }
  }
  return out;
}

export default function TagEditor({ image, readOnly }: TagEditorProps) {
  const { t } = useLang();
  const initial = image.tags?.map((tg: TagSummary) => tg.name) ?? [];
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState('');

  const mutation = useSetImageTags();
  const toast = useToast();

  useEffect(() => {
    setTags(image.tags?.map((tg) => tg.name) ?? []);
  }, [image.id, image.tags]);

  const commit = (next: string[]) => {
    const cleaned = dedupe(next);
    setTags(cleaned);
    mutation.mutate(
      { imageId: image.id, tags: cleaned },
      {
        onError: (err) => {
          const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : t('toastTagFail'));
          setTags(initial);
        },
      }
    );
  };

  const addFromDraft = () => {
    const candidate = draft.trim();
    if (!candidate) return;
    commit([...tags, candidate]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFromDraft(); }
    else if (e.key === 'Backspace' && draft === '' && tags.length > 0) { commit(tags.slice(0, -1)); }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.length === 0 && readOnly && (
          <span className="text-[11px] text-slate-500 dark:text-slate-500">{t('noTags')}</span>
        )}
        {tags.map((name) => (
          <TagChip
            key={name}
            name={name}
            onRemove={readOnly ? undefined : () => commit(tags.filter((tg) => tg !== name))}
          />
        ))}
        {!readOnly && (
          <form onSubmit={(e) => { e.preventDefault(); addFromDraft(); }}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => draft && addFromDraft()}
              placeholder={t('addTag')}
              maxLength={40}
              dir="auto"
              className="w-28 rounded-full bg-transparent ring-1 ring-dashed ring-slate-300 dark:ring-slate-700 px-3 py-1 text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-solid"
              style={{ '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
            />
          </form>
        )}
      </div>
      {mutation.isPending && (
        <svg className="h-3.5 w-3.5 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
