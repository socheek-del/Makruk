import { HealthResponse } from '@chaturanga/protocol';
import { Bot, Globe, GraduationCap, type LucideIcon, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

type ServerStatus = 'checking' | 'ok' | 'down';

const MODES: ReadonlyArray<{ key: string; icon: LucideIcon; tile: string; to?: string }> = [
  { key: 'single', icon: Bot, tile: 'bg-primary-soft text-primary', to: '/play/computer' },
  { key: 'local', icon: Users, tile: 'bg-secondary-soft text-secondary', to: '/play/local' },
  { key: 'online', icon: Globe, tile: 'bg-warning-soft text-gold', to: '/play/online' },
  { key: 'learn', icon: GraduationCap, tile: 'bg-danger-soft text-danger', to: '/learn' },
];

export function HomePage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body) => setStatus(HealthResponse.safeParse(body).success ? 'ok' : 'down'))
      .catch(() => setStatus('down'));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header className="motif-diamonds relative overflow-hidden rounded-[1.5rem] bg-primary px-6 py-7 text-on-accent shadow-card">
        <h1 className="text-4xl font-bold">{t('app.name')}</h1>
        <p className="mt-2 max-w-md text-lg opacity-90">{t('app.tagline')}</p>
      </header>

      <section aria-labelledby="modes-heading" className="flex flex-col gap-3">
        <h2 id="modes-heading" className="text-xl font-bold">
          {t('home.choose')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {MODES.map(({ key, icon: Icon, tile, to }) => {
            const content = (
              <>
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tile}`}>
                  <Icon aria-hidden className="h-7 w-7" strokeWidth={2.25} />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-semibold">{t(`modes.${key}`)}</span>
                  <span className="text-sm text-muted">{t(`modes.${key}Desc`)}</span>
                </span>
              </>
            );
            return (
              <li key={key}>
                {to ? (
                  <Link to={to} className="block rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">
                    <Card interactive className="flex items-center gap-4">
                      {content}
                    </Card>
                  </Link>
                ) : (
                  <Card className="flex items-center gap-4 opacity-70">
                    {content}
                    <Badge className="ml-auto shrink-0">{t('app.comingSoon')}</Badge>
                  </Card>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* seo-001: plain, crawlable text about Makruk for people searching "Thai chess online" / "หมากรุกไทย". */}
      <section aria-labelledby="about-makruk" data-testid="home-about" className="flex flex-col gap-2 rounded-[1.25rem] border border-line bg-surface p-5 shadow-card">
        <h2 id="about-makruk" className="text-xl font-bold">
          {t('home.aboutTitle')}
        </h2>
        <p className="text-muted">{t('home.aboutBody1')}</p>
        <p className="text-muted">{t('home.aboutBody2')}</p>
      </section>

      <footer className="text-center text-sm text-muted">
        {t('status.label')}:{' '}
        <span className={status === 'ok' ? 'text-secondary' : status === 'down' ? 'text-danger' : ''}>
          {t(`status.${status}`)}
        </span>
      </footer>
    </div>
  );
}
