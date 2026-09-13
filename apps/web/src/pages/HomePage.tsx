import { HealthResponse } from '@makruk/protocol';
import { Bot, Globe, GraduationCap, type LucideIcon, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

type ServerStatus = 'checking' | 'ok' | 'down';

const MODES: ReadonlyArray<{ key: string; icon: LucideIcon; color: string; to?: string }> = [
  { key: 'single', icon: Bot, color: 'bg-secondary' },
  { key: 'local', icon: Users, color: 'bg-primary', to: '/play/local' },
  { key: 'online', icon: Globe, color: 'bg-gold' },
  { key: 'learn', icon: GraduationCap, color: 'bg-danger' },
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
      <header className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-primary md:hidden">{t('app.name')}</h1>
        <p className="mt-2 text-lg text-muted">{t('app.tagline')}</p>
      </header>

      <section aria-labelledby="modes-heading" className="flex flex-col gap-3">
        <h2 id="modes-heading" className="text-xl font-extrabold">
          {t('home.choose')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {MODES.map(({ key, icon: Icon, color, to }) => {
            const content = (
              <>
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${color}`}>
                  <Icon aria-hidden className="h-8 w-8" strokeWidth={2.5} />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-extrabold">{t(`modes.${key}`)}</span>
                  <span className="text-sm text-muted">{t(`modes.${key}Desc`)}</span>
                </span>
              </>
            );
            return (
              <li key={key}>
                {to ? (
                  <Link to={to} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40">
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

      <footer className="text-center text-sm text-muted">
        {t('status.label')}:{' '}
        <span className={status === 'ok' ? 'text-primary' : status === 'down' ? 'text-danger' : ''}>
          {t(`status.${status}`)}
        </span>
      </footer>
    </div>
  );
}
