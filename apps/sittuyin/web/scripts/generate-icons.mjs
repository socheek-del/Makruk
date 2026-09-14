/**
 * Renders the PWA icons (PNG) from an inline SVG using Playwright's Chromium.
 * Run after changing the logo: npm run icons -w apps/sittuyin/web
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Sit-ke (shield) silhouette, the same shape used for a promoted Ne in the yun piece set. */
function logo(size, { maskable }) {
  const scale = maskable ? 0.62 : 0.78;
  const offset = (1 - scale) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="#0f6f86"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="M50 8 L71 24 C75 46 67 68 50 83 C33 68 25 46 29 24 Z" fill="#f7ecd9" stroke="#2a1a12" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M50 26 C58 36 58 48 50 58 C42 48 42 36 50 26 Z" fill="#a8802f"/>
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
