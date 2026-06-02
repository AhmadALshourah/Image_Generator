import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import { useTheme } from './hooks/useTheme.js';
import { ToastProvider } from './context/ToastContext.jsx';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="relative min-h-screen">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]
                          bg-gradient-to-br from-indigo-100/60 via-violet-50 to-transparent
                          dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-transparent" />

          <Header theme={theme} onToggleTheme={toggleTheme} />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500
                             dark:border-slate-800 dark:text-slate-500">
            Built with React, Tailwind CSS, and FastAPI.
          </footer>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
