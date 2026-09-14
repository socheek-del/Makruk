// Noto Sans Myanmar + Noto Sans (SIL OFL), self-hosted so the PWA works offline. Unicode only, never Zawgyi.
// Subset entrypoints only: the plain ones pull in Devanagari, Cyrillic and Greek that this site never shows.
import '@fontsource/noto-sans-myanmar/myanmar-400.css';
import '@fontsource/noto-sans-myanmar/myanmar-500.css';
import '@fontsource/noto-sans-myanmar/myanmar-600.css';
import '@fontsource/noto-sans/latin-400.css';
import '@fontsource/noto-sans/latin-500.css';
import '@fontsource/noto-sans/latin-600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DesignPage } from './DesignPage';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignPage />
  </StrictMode>,
);
