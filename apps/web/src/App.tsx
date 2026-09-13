import { HealthResponse } from '@makruk/protocol';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ServerStatus = 'checking' | 'ok' | 'down';

const MODES = ['single', 'online', 'local', 'learn'] as const;

export function App() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body) => setStatus(HealthResponse.safeParse(body).success ? 'ok' : 'down'))
      .catch(() => setStatus('down'));
  }, []);

  const toggleLanguage = () => void i18n.changeLanguage(i18n.language === 'th' ? 'en' : 'th');

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <span className="rounded-full bg-sky/10 px-3 py-1 text-sm font-extrabold text-sky">
          {t('app.comingSoon')}
        </span>
        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-xl border-2 border-b-4 border-line px-3 py-1 text-sm font-extrabold text-muted active:translate-y-0.5 active:border-b-2"
        >
          {t('language.switch')}
        </button>
      </header>

      <section className="text-center">
        <h1 className="text-5xl font-extrabold text-brand">{t('app.name')}</h1>
        <p className="mt-3 text-lg text-muted">{t('app.tagline')}</p>
      </section>

      <ul className="grid gap-3">
        {MODES.map((mode) => (
          <li key={mode}>
            <button
              type="button"
              disabled
              className="w-full rounded-2xl border-2 border-b-4 border-line bg-paper px-5 py-4 text-left text-lg font-extrabold opacity-70"
            >
              {t(`modes.${mode}`)}
            </button>
          </li>
        ))}
      </ul>

      <footer className="mt-auto text-center text-sm text-muted">
        {t('status.label')}:{' '}
        <span className={status === 'ok' ? 'text-brand' : status === 'down' ? 'text-red-500' : ''}>
          {t(`status.${status}`)}
        </span>
      </footer>
    </main>
  );
}
