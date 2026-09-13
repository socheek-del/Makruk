import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import th from './locales/th.json';
import { useSettings } from './stores/settings';

export const resources = { th: { translation: th }, en: { translation: en } } as const;

const initial = useSettings.getState().language;

void i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: 'th',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initial;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// The settings store is the source of truth for the UI language.
useSettings.subscribe((state, previous) => {
  if (state.language !== previous.language) void i18n.changeLanguage(state.language);
});

export default i18n;
