/**
 * sit-005 evidence: screenshots of the design showcase at the two review widths.
 *
 * Usage: node scripts/capture-design.mjs [url]   (defaults to the preview server)
 * Serve a build first: npm run build -w apps/sittuyin/web && npm run preview -w apps/sittuyin/web
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = new URL('../../docs/evidence/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const width of [390, 1280]) {
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
    await page.goto(url);
    await page.waitForSelector(`[data-testid="showcase-${scheme}"]`);
    // Passed as a string: the body runs in the browser, where this file's Node lint rules do not apply.
    await page.evaluate('document.fonts.ready');
    const section = page.getByTestId(`showcase-${scheme}`);
    await section.screenshot({ path: `${out}design-${scheme}-${width}.png` });
    await page.close();
    console.log(`design-${scheme}-${width}.png`);
  }
}
await browser.close();
