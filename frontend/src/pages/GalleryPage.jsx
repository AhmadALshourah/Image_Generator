import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteImage, listImages } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import ImageCard from '../components/ImageCard.jsx';
import ImageModal from '../components/ImageModal.jsx';
import Pagination from '../components/Pagination.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const PAGE_SIZE = 12;

function EmptyGallery() {
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
        <h3 className="text-base font-semibold">Your gallery is empty</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Generate your first image to see it here.
        </p>
      </div>
      <Link
        to="/"
        className="btn-primary mt-2"
      >
        Create an image
      </Link>
    </div>
  );
}

export default function GalleryPage() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPage = useCallback(
    async (nextOffset) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listImages({ limit: PAGE_SIZE, offset: nextOffset });
        setItems(data.items);
        setTotal(data.total);
        setOffset(data.offset);
      } catch (err) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const handleDelete = async (image) => {
    setDeletingId(image.id);
    try {
      await deleteImage(image.id);
      toast.success('Image deleted');
      setSelected(null);

      // Optimistic refresh — stay on same page unless it becomes empty
      const nextTotal = total - 1;
      const lastValidOffset = Math.max(0, Math.floor((nextTotal - 1) / PAGE_SIZE) * PAGE_SIZE);
      const targetOffset = Math.min(offset, lastValidOffset);
      await fetchPage(targetOffset);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Gallery</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {total > 0
              ? `${total} image${total === 1 ? '' : 's'} generated and saved`
              : 'All your generated images, in one place'}
          </p>
        </div>
        <Link
          to="/"
          className="btn-primary self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="h-4 w-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New image
        </Link>
      </div>

      {loading && items.length === 0 && (
        <div className="card">
          <LoadingSpinner />
        </div>
      )}

      {!loading && error && (
        <ErrorMessage message={error} />
      )}

      {!loading && !error && items.length === 0 && <EmptyGallery />}

      {items.length > 0 && (
        <>
          <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
            {items.map((image) => (
              <ImageCard key={image.id} image={image} onClick={setSelected} />
            ))}
          </div>

          <Pagination
            total={total}
            limit={PAGE_SIZE}
            offset={offset}
            onChange={(next) => fetchPage(next)}
            disabled={loading}
          />
        </>
      )}

      <ImageModal
        image={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        deleting={deletingId === selected?.id}
      />
    </main>
  );
}
