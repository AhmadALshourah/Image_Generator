import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import PageFallback from './components/PageFallback';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

// Code-splitting: heavier secondary pages load on demand.
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="relative min-h-screen">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]
                            bg-gradient-to-br from-indigo-100/60 via-violet-50 to-transparent
                            dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-transparent" />

            <Header theme={theme} onToggleTheme={toggleTheme} />

            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>

            <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500
                               dark:border-slate-800 dark:text-slate-500">
              Built with React, TypeScript, Tailwind CSS, TanStack Query, and FastAPI.
            </footer>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
