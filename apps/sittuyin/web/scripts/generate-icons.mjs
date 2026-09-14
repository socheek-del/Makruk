/**
 * Renders the PWA icons and the Open Graph image (PNG) from inline SVG and HTML using Playwright's Chromium.
 * Run after changing the logo: npm run icons -w apps/sittuyin/web
 */
import { readdirSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const require = createRequire(import.meta.url);

/** The site's own fonts, embedded so the image never depends on what the machine has installed. */
function fontFace(pkg, family, subset) {
  const dir = join(dirname(require.resolve(`${pkg}/package.json`)), 'files');
  const file = readdirSync(dir).find((name) => name.endsWith(`-${subset}-700-normal.woff2`));
  const data = readFileSync(join(dir, file)).toString('base64');
  return `@font-face{font-family:'${family}';font-weight:700;src:url(data:font/woff2;base64,${data}) format('woff2')}`;
}

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

// Open Graph image (1200x630): name in Burmese and English beside a lacquer board with its two promotion
// diagonals. No site address appears in it (the domain is temporary).
const cells = Array.from({ length: 64 }, () => '<i></i>').join('');
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<html><head><style>
  ${fontFace('@fontsource/noto-sans-myanmar', 'Noto Sans Myanmar', 'myanmar')}
  ${fontFace('@fontsource/noto-sans', 'Noto Sans', 'latin')}
  body{margin:0;width:1200px;height:630px;display:flex;align-items:center;gap:64px;padding:0 80px;box-sizing:border-box;
    background:radial-gradient(circle at 20% 20%,#16869f,#0f6f86 55%,#0b5466);color:#f7ecd9;font-family:'Noto Sans Myanmar','Noto Sans',sans-serif}
  .text{flex:1;display:flex;flex-direction:column;gap:18px}
  .logo{width:110px;height:110px}
  h1{margin:0;font-size:96px;line-height:1.45;font-weight:700}
  h2{margin:0;font-family:'Noto Sans',sans-serif;font-size:40px;font-weight:700;white-space:nowrap}
  p{margin:0;font-size:30px;line-height:1.7;color:#e5d3b3}
  .board{position:relative;width:420px;height:420px;border:12px solid #2a1a12;border-radius:14px;background:#b4452c;display:grid;
    grid-template-columns:repeat(8,1fr);box-shadow:0 20px 50px rgba(0,0,0,.35)}
  .board i{border:1px solid rgba(42,26,18,.55)}
  .board svg{position:absolute;inset:0}
</style></head><body>
  <div class="text">
    ${logo(110, { maskable: false }).replace('<svg ', '<svg class="logo" ')}
    <h1>စစ်တုရင်</h1>
    <h2>Sittuyin · Burmese chess</h2>
    <p>မြန်မာ့ရိုးရာ စစ်တုရင် — အခမဲ့ ကစားရန်</p>
  </div>
  <div class="board">${cells}<svg viewBox="0 0 8 8" preserveAspectRatio="none">
    <line x1="0" y1="8" x2="8" y2="0" stroke="#d9b36a" stroke-width="0.06"/><line x1="0" y1="0" x2="8" y2="8" stroke="#d9b36a" stroke-width="0.06"/>
  </svg></div>
</body></html>`);
await page.evaluate(() => globalThis.document.fonts.ready);
await page.screenshot({ path: join(out, 'og-image.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
console.log('wrote public/og-image.png');

await browser.close();
