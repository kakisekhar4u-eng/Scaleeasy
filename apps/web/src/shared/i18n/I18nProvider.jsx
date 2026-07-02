import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from './en';

const I18nContext = createContext();

const LANGUAGE_META = {
  en: { label: 'English', nativeLabel: 'English' },
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी' },
  te: { label: 'Telugu', nativeLabel: 'తెలుగు' },
  ta: { label: 'Tamil', nativeLabel: 'தமிழ்' },
  kn: { label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  ml: { label: 'Malayalam', nativeLabel: 'മലയാളം' },
};

const langCache = { en };

const langLoaders = {
  en: () => Promise.resolve({ default: en }),
  hi: () => import('./hi.js'),
  te: () => import('./te.js'),
  ta: () => import('./ta.js'),
  kn: () => import('./kn.js'),
  ml: () => import('./ml.js'),
};

async function loadLanguage(code) {
  if (langCache[code]) return langCache[code];
  const loader = langLoaders[code];
  if (!loader) return en;
  try {
    const mod = await loader();
    langCache[code] = mod.default;
    return mod.default;
  } catch {
    return en;
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

export function I18nProvider({ children, initialLanguage = 'en' }) {
  const [language, setLanguageState] = useState(initialLanguage);
  const [translations, setTranslations] = useState(en);

  const setLanguage = useCallback(async (code) => {
    const lang = await loadLanguage(code);
    setTranslations(lang);
    setLanguageState(code);
    try { localStorage.setItem('scaleeasy_language', code); } catch {}
  }, []);

  const t = useCallback((key, fallback) => {
    const value = getNestedValue(translations, key);
    if (value !== undefined) return value;
    const enValue = getNestedValue(en, key);
    if (enValue !== undefined) return enValue;
    return fallback || key;
  }, [translations]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    languages: LANGUAGE_META,
    availableLanguages: Object.keys(LANGUAGE_META),
  }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export { LANGUAGE_META };
