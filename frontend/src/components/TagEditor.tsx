import { useEffect, useState, type KeyboardEvent } from 'react';

import TagChip from './TagChip';
import { useSetImageTags } from '../api/queries';
import { useToast } from '../context/ToastContext';
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
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

export default function TagEditor({ image, readOnly }: TagEditorProps) {
  const initial = image.tags?.map((t: TagSummary) => t.name) ?? [];
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState('');

  const mutation = useSetImageTags();
  const toast = useToast();

  // Resync when the underlying image changes (e.g. modal switched targets).
  useEffect(() => {
    setTags(image.tags?.map((t) => t.name) ?? []);
  }, [image.id, image.tags]);

  const commit = (next: string[]) => {
    const cleaned = dedupe(next);
    setTags(cleaned);
    mutation.mutate(
      { imageId: image.id, tags: cleaned },
      {
        onError: (err) => {
          const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
          toast.error(typeof detail === 'string' ? detail : 'Could not update tags');
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
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addFromDraft();
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      commit(tags.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.length === 0 && readOnly && (
          <span className="text-[11px] text-slate-500 dark:text-slate-500">No tags</span>
        )}
        {tags.map((name) => (
          <TagChip
            key={name}
            name={name}
            onRemove={readOnly ? undefined : () => commit(tags.filter((t) => t !== name))}
          />
        ))}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => draft && addFromDraft()}
            placeholder="Add a tag and press Enter"
            maxLength={40}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs
                       focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                       dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          {mutation.isPending && (
            <svg className="h-3.5 w-3.5 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
