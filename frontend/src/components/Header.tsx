import { NavLink } from 'react-router-dom';

import ThemeToggle from './ThemeToggle';
import LoginButton from './LoginButton';
import type { Theme } from '../types/api';

const linkBase = 'rounded-lg px-3 py-1.5 text-sm font-medium transition';
const linkInactive =
  'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100';
const linkActive =
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';

export interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur-md
                 dark:border-slate-800/60 dark:bg-slate-950/70"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl
                       bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight">AI Image Generator</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Powered by gpt-image-1</p>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            Create
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            Gallery
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            Stats
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <LoginButton />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
