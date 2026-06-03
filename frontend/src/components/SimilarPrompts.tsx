import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useSimilarPrompts } from '../api/queries';

export interface SimilarPromptsProps {
  prompt: string;
  onPick: (prompt: string) => void;
}

/**
 * Inline autocomplete: while the user is typing, show 3 most-similar past
 * prompts ranked by cosine similarity over `text-embedding-3-small` vectors.
 *
 * Self-suppresses when:
 *   * the prompt is too short
 *   * embeddings are disabled on the backend (the endpoint returns [] then)
 *   * there are no past images with embeddings yet
 */
export default function SimilarPrompts({ prompt, onPick }: SimilarPromptsProps) {
  const debounced = useDebouncedValue(prompt, 350);
  const query = useSimilarPrompts(debounced);

  const items = query.data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-900/30">
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Similar past prompts
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onPick(item.prompt)}
              className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-xs transition
                         hover:bg-white dark:hover:bg-slate-800"
            >
              <img
                src={item.thumbnail_url}
                alt=""
                className="h-8 w-8 flex-shrink-0 rounded object-cover"
                loading="lazy"
              />
              <span className="line-clamp-2 flex-1 text-slate-700 dark:text-slate-300" dir="auto">
                {item.prompt}
              </span>
              <span className="flex-shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                {Math.round(item.score * 100)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
