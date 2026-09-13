import '@fontsource-variable/nunito';
import '@fontsource/mitr/400.css';
import '@fontsource/mitr/500.css';
import '@fontsource/mitr/600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './i18n';
import './index.css';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
