import LoadingSpinner from './LoadingSpinner';

/**
 * Suspense fallback shown while a route's bundle is downloading.
 * Matches the visual weight of the in-card spinner so the page doesn't jank.
 */
export default function PageFallback() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="card">
        <LoadingSpinner />
      </div>
    </main>
  );
}
