import { cn } from '@chaturanga/ui';
import { Info, type LucideIcon, Settings, Swords } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router';
import { ThemeController } from './ThemeController';

const NAV: ReadonlyArray<{ to: string; key: string; icon: LucideIcon; end?: boolean }> = [
  { to: '/', key: 'nav.play', icon: Swords, end: true },
  { to: '/about', key: 'nav.about', icon: Info },
  { to: '/settings', key: 'nav.settings', icon: Settings },
];

export function AppShell() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-canvas text-ink md:flex">
      <ThemeController />
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:top-0 md:h-dvh md:w-64 md:flex-col md:gap-1 md:border-t-0 md:border-r md:bg-canvas md:px-4 md:py-6"
      >
        <Link to="/" className="mb-5 hidden items-center gap-2.5 px-3 text-2xl font-bold text-primary md:flex">
          <span aria-hidden className="h-3.5 w-3.5 rounded-full border-[3px] border-gold" />
          {t('app.name')}
        </Link>
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition-colors md:flex-none md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm',
                isActive ? 'text-primary md:bg-primary-soft' : 'text-muted hover:text-ink md:hover:bg-surface-2',
              )
            }
          >
            <Icon aria-hidden className="h-6 w-6" strokeWidth={2.25} />
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
