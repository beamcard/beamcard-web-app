import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { de } from './locales/de';
import { uk } from './locales/uk';

export const SUPPORTED_LANGS = ['en', 'de', 'uk'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

/** Flag emoji per language, for selectors and read-only display. */
export const LANG_FLAGS: Record<Lang, string> = { en: '🇬🇧', de: '🇩🇪', uk: '🇺🇦' };

const STORAGE_KEY = 'beamcard.lang';

/** Saved choice → browser language → English. */
function detectLanguage(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (SUPPORTED_LANGS as readonly string[]).includes(saved)) return saved as Lang;
  } catch {
    /* localStorage may be unavailable */
  }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return (SUPPORTED_LANGS as readonly string[]).includes(nav) ? (nav as Lang) : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    uk: { translation: uk },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
});

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

export default i18n;
