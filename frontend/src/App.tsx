import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import PageFallback from './components/PageFallback';
import AuthGate from './components/AuthGate';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LangProvider, useLang } from './context/LangContext';

const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const StatsPage   = lazy(() => import('./pages/StatsPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));

/** Subtle fixed orbs — dark mode only, same palette as the auth screen */
function DarkOrbs() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden hidden dark:block" aria-hidden>
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, #4f46e5 0%, #3730a3 50%, transparent 70%)',
        filter: 'blur(90px)', opacity: 0.12,
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, #7c3aed 0%, #5b21b6 50%, transparent 70%)',
        filter: 'blur(100px)', opacity: 0.1,
      }} />
    </div>
  );
}

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();

  return (
    <div className="min-h-screen theme-anim">
      <DarkOrbs />
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-center border-t border-slate-200 dark:border-violet-900/30 mt-4">
        <p className="text-xs text-slate-400 dark:text-violet-900/60">{t('footer')}</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <ToastProvider>
            <AuthGate>
              <AppShell />
            </AuthGate>
          </ToastProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
