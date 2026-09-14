/**
 * Renders the PWA icons (PNG) from an inline SVG using Playwright's Chromium.
 * Run after changing the logo: npm run icons -w apps/web
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Khun silhouette (same shape as the in-app piece), centred; `scale` keeps maskable icons inside the safe zone. */
function logo(size, { maskable }) {
  const scale = maskable ? 0.62 : 0.78;
  const offset = (1 - scale) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="#3a3f9b"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="#fff8ec" stroke="#3b2a1a" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <rect x="20" y="78" width="60" height="10" rx="5"/>
    <path d="M31 80 C31 62 36 52 40 45 H60 C64 52 69 62 69 80 Z"/>
    <path d="M36 45 L33 23 L43 31 L50 16 L57 31 L67 23 L64 45 Z"/>
    <circle cx="50" cy="16" r="4" fill="#e2b65a"/>
  </g>
</svg>`;
}

const ICONS = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const icon of ICONS) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${logo(icon.size, icon)}</body></html>`);
  await page.screenshot({ path: join(out, icon.file), omitBackground: !icon.maskable, clip: { x: 0, y: 0, width: icon.size, height: icon.size } });
  console.log(`wrote public/${icon.file}`);
}
await browser.close();
