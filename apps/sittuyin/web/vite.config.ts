import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { PRODUCT } from './product.config';
import { SITE_URL } from './site.config';

/** Puts the configured site address and the product's languages and settings key into index.html. */
function siteAddress(): Plugin {
  return {
    name: 'site-address',
    transformIndexHtml: (html) =>
      html
        .replaceAll('%SITE_URL%', SITE_URL)
        .replaceAll('%DEFAULT_LOCALE%', PRODUCT.defaultLocale)
        .replaceAll('%LOCALES_JSON%', JSON.stringify(PRODUCT.locales))
        .replaceAll('%SETTINGS_KEY%', `${PRODUCT.storagePrefix}settings`),
  };
}

export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(SITE_URL) },
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
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//],
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
