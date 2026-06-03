import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useDeleteImage, useGenerateImage, useImagesQuery } from '../api/queries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useToast } from '../context/ToastContext';

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

function extractErrorMessage(err: unknown): string {
  const e = err as ApiErrorShape;
  if (e?.response?.data?.detail) {
    const detail = e.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg as string;
  }
  if (e?.message) return e.message;
  return 'Unexpected error. Please try again.';
}

function EmptyGallery({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl
                      bg-gradient-to-br from-indigo-100 to-violet-100
                      dark:from-indigo-950/40 dark:to-violet-950/40">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
             className="h-8 w-8 text-indigo-500">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
      <div>
        <h3 className="text-base font-semibold">
          {hasFilters ? 'No images match your filters' : 'Your gallery is empty'}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {hasFilters
            ? 'Try a different search term or clear the filters.'
            : 'Generate your first image to see it here.'}
        </p>
      </div>
      {!hasFilters && (
        <Link to="/" className="btn-primary mt-2">
          Create an image
        </Link>
      )}
    </div>
  );
}

export default function GalleryPage() {
  const toast = useToast();

  const [filters, setFilters] = useState<GalleryFilters>(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ImageRecord | null>(null);

  const debouncedQ = useDebouncedValue(filters.q, 300);

  const queryParams: ListImagesParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      q: debouncedQ || undefined,
      size: filters.size || undefined,
      quality: filters.quality || undefined,
      background: filters.background || undefined,
      tag: filters.tag || undefined,
    }),
    [debouncedQ, filters.size, filters.quality, filters.background, filters.tag, offset]
  );

  const { data, isLoading, isFetching, error } = useImagesQuery(queryParams);
  const deleteMutation = useDeleteImage();
  const generateMutation = useGenerateImage();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const hasActiveFilter = Boolean(
    filters.q || filters.size || filters.quality || filters.background || filters.tag
  );

  useEffect(() => {
    setOffset(0);
  }, [debouncedQ, filters.size, filters.quality, filters.background, filters.tag]);

  useEffect(() => {
    if (!selected) return;
    const fresh = items.find((img) => img.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [items, selected]);

  const handleDelete = (image: ImageRecord) => {
    deleteMutation.mutate(image.id, {
      onSuccess: () => {
        toast.success('Image deleted');
        if (selected?.id === image.id) setSelected(null);
        const newTotal = Math.max(0, total - 1);
        const lastValidOffset = Math.max(
          0,
          Math.floor(Math.max(0, newTotal - 1) / PAGE_SIZE) * PAGE_SIZE
        );
        if (offset > lastValidOffset) setOffset(lastValidOffset);
      },
      onError: (err) => {
        toast.error(extractErrorMessage(err));
      },
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
      toast.success('New variation generated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const isInitialLoad = isLoading && !data;
  const isBusy = isFetching && !isInitialLoad;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Gallery</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {total > 0
              ? `${total} image${total === 1 ? '' : 's'} generated and saved`
              : 'All your generated images, in one place'}
          </p>
        </div>
        <Link to="/" className="btn-primary self-start sm:self-auto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="h-4 w-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New image
        </Link>
      </div>

      <GallerySearch
        filters={filters}
        onChange={setFilters}
        disabled={isInitialLoad}
        resultCount={data?.total}
      />

      {isInitialLoad && (
        <div className="card">
          <LoadingSpinner />
        </div>
      )}

      {!isInitialLoad && error && <ErrorMessage message={extractErrorMessage(error)} />}

      {!isInitialLoad && !error && items.length === 0 && (
        <EmptyGallery hasFilters={hasActiveFilter} />
      )}

      {items.length > 0 && (
        <>
          <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 transition-opacity ${
              isBusy ? 'opacity-60' : ''
            }`}
          >
            {items.map((image) => (
              <ImageCard key={image.id} image={image} onClick={setSelected} />
            ))}
          </div>

          <Pagination
            total={total}
            limit={PAGE_SIZE}
            offset={offset}
            onChange={(next) => setOffset(next)}
            disabled={isBusy}
          />
        </>
      )}

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
