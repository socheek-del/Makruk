import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
// Relative path on purpose: Vite bundles a config's relative imports, not workspace packages.
import { familyLinks } from '../../../packages/family/src/sites';
import { PRODUCT } from './product.config';
import { SITE_URL } from './site.config';
import { buildRobots, buildSitemap } from './src/features/seo/sitemap';

/**
 * Puts the configured site address and the product's languages and settings key into index.html, and
 * serves/emits robots.txt and sitemap.xml (sit-010).
 */
function siteAddress(): Plugin {
  const files: Record<string, { type: string; body: () => string }> = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', body: () => buildRobots(SITE_URL) },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', body: () => buildSitemap(SITE_URL) },
  };
  // Must return nothing: Vite treats a function returned from configureServer as a post-middleware hook.
  const serve = (server: { middlewares: { use: (fn: (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => void) => unknown } }): void => {
    server.middlewares.use((req, res, next) => {
      const file = files[(req.url ?? '').split('?')[0]!];
      if (!file) return next();
      res.setHeader('content-type', file.type);
      res.end(file.body());
    });
  };
  return {
    name: 'site-address',
    transformIndexHtml: (html) =>
      html
        .replaceAll('%SITE_URL%', SITE_URL)
        .replaceAll('%DEFAULT_LOCALE%', PRODUCT.defaultLocale)
        .replaceAll('%LOCALES_JSON%', JSON.stringify(PRODUCT.locales))
        .replaceAll('%SETTINGS_KEY%', `${PRODUCT.storagePrefix}settings`),
    configureServer: serve,
    configurePreviewServer: serve,
    generateBundle() {
      for (const [path, file] of Object.entries(files)) this.emitFile({ type: 'asset', fileName: path.slice(1), source: file.body() });
    },
  };
}

export default defineConfig({
  // plat-006: sibling sites for the "more games" links, with addresses from their own site.config.ts.
  define: { __SITE_URL__: JSON.stringify(SITE_URL), __FAMILY__: JSON.stringify(familyLinks('sittuyin')) },
  plugins: [
    react(),
    tailwindcss(),
    siteAddress(),
    // Installable PWA; everything the site does works offline, because nothing here needs a server yet.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: 'စစ်တုရင် · Sittuyin',
        short_name: 'စစ်တုရင်',
        description: 'မြန်မာ့ရိုးရာ စစ်တုရင် — Learn and play Sittuyin, the traditional chess of Myanmar',
        lang: PRODUCT.defaultLocale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#eff2f2',
        theme_color: '#0f6f86',
        categories: ['games', 'education'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  // Online play needs the Sittuyin Worker (wrangler dev on :8788, not Makruk's :8787).
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://127.0.0.1:8788',
      '/ws': { target: 'ws://127.0.0.1:8788', ws: true },
    },
  },
  preview: {
    port: 4174,
    proxy: {
      '/api': 'http://127.0.0.1:8788',
      '/ws': { target: 'ws://127.0.0.1:8788', ws: true },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'happy-dom',
  },
});
