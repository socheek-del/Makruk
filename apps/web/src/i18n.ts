import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import th from './locales/th.json';

export const LANGUAGES = ['th', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'makruk.lang';

function storedLanguage(): Language {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
  }
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Storage unavailable (private mode) — language still applies for this visit.
  }
});

void i18n.use(initReactI18next).init({
  resources: { th: { translation: th }, en: { translation: en } },
  lng: storedLanguage(),
  fallbackLng: 'th',
  interpolation: { escapeValue: false },
});

export default i18n;
