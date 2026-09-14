import { useEffect } from 'react';
import { type ColorScheme, useSettings } from '../stores/settings';

export function resolveColorScheme(scheme: ColorScheme, prefersDark: boolean): 'light' | 'dark' {
  return scheme === 'system' ? (prefersDark ? 'dark' : 'light') : scheme;
}

/** Applies the colour scheme to <html data-theme> and follows OS changes when set to "system". */
export function ThemeController() {
  const scheme = useSettings((s) => s.colorScheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = resolveColorScheme(scheme, media.matches);
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0d1a1f' : '#0f6f86');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [scheme]);

  return null;
}
