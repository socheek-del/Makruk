import { GraduationCap, type LucideIcon, Settings, Swords } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router';
import { cn } from '../lib/cn';
import { ThemeController } from './ThemeController';

const NAV: ReadonlyArray<{ to: string; key: string; icon: LucideIcon; end?: boolean }> = [
  { to: '/', key: 'nav.play', icon: Swords, end: true },
  { to: '/learn', key: 'nav.learn', icon: GraduationCap },
  { to: '/settings', key: 'nav.settings', icon: Settings },
];

export function AppShell() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-canvas text-ink md:flex">
      <ThemeController />
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-line bg-canvas px-2 pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:h-dvh md:w-64 md:flex-col md:gap-2 md:border-t-0 md:border-r-2 md:px-4 md:py-6"
      >
        <Link to="/" className="mb-4 hidden px-3 text-3xl font-extrabold text-primary md:block">
          {t('app.name')}
        </Link>
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-extrabold uppercase md:flex-none md:flex-row md:gap-4 md:border-2 md:px-3 md:py-3 md:text-sm',
                isActive ? 'text-secondary md:border-secondary md:bg-secondary-soft' : 'text-muted md:border-transparent hover:md:bg-surface-2',
              )
            }
          >
            <Icon aria-hidden className="h-7 w-7" strokeWidth={2.5} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
