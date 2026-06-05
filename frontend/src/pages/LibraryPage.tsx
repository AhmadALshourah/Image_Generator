import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useDeleteImage, useGenerateImage, useLibraryQuery } from '../api/queries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';

import ImageCard from '../components/ImageCard';
import ImageModal from '../components/ImageModal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import GallerySearch from '../components/GallerySearch';

import type { GalleryFilters, ImageRecord, ListImagesParams } from '../types/api';

const PAGE_SIZE = 12;
const EMPTY_FILTERS: GalleryFilters = { q: '', size: '', quality: '', background: '', tag: '' };

interface ApiErrorShape {
  response?: { data?: { detail?: string | Array<{ msg?: string }> } };
  message?: string;
}

function extractError(err: unknown): string {
  const e = err as ApiErrorShape;
  if (e?.response?.data?.detail) {
    const d = e.response.data.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return d[0].msg as string;
  }
  return (err as ApiErrorShape)?.message ?? 'Unexpected error.';
}

function EmptyLibrary({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useLang();
  return (
    <div className="anim-fadeUp text-center py-20">
      <div className="mx-auto grid place-items-center h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="h-8 w-8">
          {hasFilters
            ? <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>
            : <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>
          }
        </svg>
      </div>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
        {hasFilters ? t('noMatch') : t('libraryEmpty')}
      </p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
        {hasFilters ? t('noMatchSub') : t('libraryEmptySub')}
      </p>
      {!hasFilters && (
        <Link to="/" className="mt-4 inline-flex">
          <span className="btn-primary">{t('createFirst')}</span>
        </Link>
      )}
    </div>
  );
}

export default function LibraryPage() {
  const toast = useToast();
  const { t } = useLang();

  const [filters, setFilters] = useState<GalleryFilters>(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ImageRecord | null>(null);

  const debouncedQ = useDebouncedValue(filters.q, 300);

  const queryParams: ListImagesParams = useMemo(
    () => ({
      limit: PAGE_SIZE, offset,
      q: debouncedQ || undefined,
      size: filters.size || undefined,
      quality: filters.quality || undefined,
      background: filters.background || undefined,
      tag: filters.tag || undefined,
    }),
    [debouncedQ, filters.size, filters.quality, filters.background, filters.tag, offset]
  );

  const { data, isLoading, isFetching, error } = useLibraryQuery(queryParams);
  const deleteMutation = useDeleteImage();
  const generateMutation = useGenerateImage();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasActiveFilter = Boolean(filters.q || filters.size || filters.quality || filters.background || filters.tag);

  useEffect(() => { setOffset(0); }, [debouncedQ, filters.size, filters.quality, filters.background, filters.tag]);

  useEffect(() => {
    if (!selected) return;
    const fresh = items.find((img) => img.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [items, selected]);

  const handleDelete = (image: ImageRecord) => {
    deleteMutation.mutate(image.id, {
      onSuccess: () => {
        toast.success(t('toastDeleted'));
        if (selected?.id === image.id) setSelected(null);
        const newTotal = Math.max(0, total - 1);
        const lastValidOffset = Math.max(0, Math.floor(Math.max(0, newTotal - 1) / PAGE_SIZE) * PAGE_SIZE);
        if (offset > lastValidOffset) setOffset(lastValidOffset);
      },
      onError: (err) => toast.error(extractError(err)),
    });
  };

  const handleRegenerate = async (image: ImageRecord) => {
    try {
      const newImage = await generateMutation.mutateAsync({
        prompt: image.prompt,
        size: image.size as never,
        quality: image.quality as never,
        background: image.background as never,
        output_format: image.output_format as never,
        force: true,
      });
      setSelected(newImage);
      toast.success(t('toastNewVar'));
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const isInitialLoad = isLoading && !data;
  const isBusy = isFetching && !isInitialLoad;
  const countLabel = t('libraryCount').replace('{n}', String(total));

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-end justify-between gap-4 mb-5 anim-fadeUp">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {t('library')}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {total > 0 ? countLabel : t('librarySub')}
          </p>
        </div>
        <Link to="/">
          <span className="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-[18px] w-[18px]">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t('newImage')}
          </span>
        </Link>
      </div>

      <GallerySearch filters={filters} onChange={setFilters} disabled={isInitialLoad} resultCount={data?.total} />

      {isInitialLoad && <div className="card"><LoadingSpinner /></div>}
      {!isInitialLoad && error && <ErrorMessage message={extractError(error)} />}
      {!isInitialLoad && !error && items.length === 0 && <EmptyLibrary hasFilters={hasActiveFilter} />}

      {items.length > 0 && (
        <>
          <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 transition-opacity ${isBusy ? 'opacity-60' : ''}`}>
            {items.map((image) => (
              <ImageCard key={image.id} image={image} onClick={setSelected} />
            ))}
          </div>
          <Pagination total={total} limit={PAGE_SIZE} offset={offset} onChange={(next) => setOffset(next)} disabled={isBusy} />
        </>
      )}

      {/* Library images: user can always delete/regenerate their own */}
      <ImageModal
        image={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onRegenerate={handleRegenerate}
        deleting={deleteMutation.isPending && deleteMutation.variables === selected?.id}
        regenerating={generateMutation.isPending}
      />
    </main>
  );
}
