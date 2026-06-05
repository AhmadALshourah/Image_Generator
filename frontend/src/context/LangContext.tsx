import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { makeT, TR, type Lang } from '../i18n/translations';

interface LangApi {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
  isRtl: boolean;
}

const LangContext = createContext<LangApi | null>(null);

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem('image-gen-lang');
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {}
  return 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('image-gen-lang', lang); } catch {}
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useCallback((key: string, fallback?: string) => makeT(lang)(key, fallback), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, isRtl: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangApi {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

// re-export so consumers can import from one place
export { TR, type Lang };
