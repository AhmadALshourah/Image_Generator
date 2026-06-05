import { NavLink } from 'react-router-dom';
import LoginButton from './LoginButton';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import type { Theme } from '../types/api';

export interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

function IconImage({ size = 19 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function IconSparkles({ size = 17 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function IconGrid({ size = 17 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconChart({ size = 17 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSun({ size = 19 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon({ size = 19 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function IconGlobe({ size = 17 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconBook({ size = 17 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const { t, lang, setLang } = useLang();
  const { isAuthenticated, isAdmin } = useAuth();

  const navItems = [
    { to: '/',        end: true,  labelKey: 'create',  Icon: IconSparkles, always: true  },
    { to: '/gallery', end: false, labelKey: 'gallery', Icon: IconGrid,     always: true  },
    { to: '/library', end: false, labelKey: 'library', Icon: IconBook,     always: false },
    { to: '/stats',   end: false, labelKey: 'stats',   Icon: IconChart,    always: true  },
  ].filter(item => item.always || (isAuthenticated && !isAdmin));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-violet-900/30 bg-white/70 dark:bg-[#0d0a1e]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 min-w-0">
          <span
            className="grid place-items-center h-9 w-9 rounded-xl text-white shadow-lg shadow-indigo-500/30 shrink-0"
            style={{ backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }}
          >
            <IconImage size={19} />
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {t('brand')}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {t('tagline')}
            </span>
          </span>
        </NavLink>

        {/* Nav */}
        <nav className="flex items-center gap-1 mx-auto sm:mx-0 sm:ms-6">
          {navItems.map(({ to, end, labelKey, Icon }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`
              }
              style={({ isActive }) =>
                isActive ? { backgroundImage: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' } : {}
              }
            >
              <Icon size={17} />
              <span className="hidden sm:inline">{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 ms-auto">
          {/* Language toggle — icon-only on very small screens */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            aria-label="Toggle language"
            className="inline-flex items-center gap-1.5 h-10 px-2 sm:px-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <IconGlobe size={17} />
            <span className="hidden min-[360px]:inline">{t('switchToAr')}</span>
          </button>

          <LoginButton />

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={t('toggleTheme')}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus-visible:ring-2"
            style={{ '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
          >
            {theme === 'dark' ? <IconSun size={19} /> : <IconMoon size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}
