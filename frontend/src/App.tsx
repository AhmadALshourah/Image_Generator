import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import PageFallback from './components/PageFallback';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LangProvider, useLang } from './context/LangContext';

const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();

  return (
    <div className="min-h-screen theme-anim">
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

      <footer className="max-w-6xl mx-auto px-6 py-10 text-center border-t border-slate-200 dark:border-slate-800 mt-4">
        <p className="text-xs text-slate-400 dark:text-slate-600">{t('footer')}</p>
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
            <AppShell />
          </ToastProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
