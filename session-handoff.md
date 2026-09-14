# Session Handoff

## Verified Now

- What is currently working: the site at https://th-chess.beanroti.com is open to everyone (no accounts):
  play the computer, online (quick match / room link), pass-and-play, 12 open lessons, About page. Games
  survive a refresh; language and settings persist per browser. SEO tags, sitemap and robots are live.
- What verification actually ran: `npm run verify` via CI; web unit tests (110); full Playwright suite
  (65/65) locally; production checks of static and rendered SEO tags; README media reviewed frame by frame.

## Changed This Session

- Code or behavior added: session persistence (`stores/localSession.ts`), streak removal and lesson
  unlocking, account UI removal (anonymous seat token only), About page, SEO (`features/seo`,
  `index.html`, `public/robots.txt`, `public/sitemap.xml`, `public/og-image.png`), lesson banner fix.
- Infrastructure or harness changes: README + `docs/media` demos, `CONTRIBUTING.md`, feature list status
  `deferred` for owner-removed features.

## Broken Or Unverified

- Known defect: none open.
- Unverified path: Google indexing/ranking (needs Search Console); Thai copy not natively reviewed.
- Risk for the next session: worker account routes remain deployed but unused — remove or re-enable
  deliberately. README GIFs/screenshots go stale when the UI changes (capture script lives in the session
  scratchpad; re-create with Playwright video + ffmpeg if needed).

## Next Best Step

- Highest-priority unfinished feature: `polish-002` (native Thai review) and `seo-001` Search Console step —
  both owner actions.
- Why it is next: every other feature is passing or deferred by the owner.
- What counts as passing: reviewer sign-off in `docs/i18n-review.md` with corrections applied; site verified
  in Search Console with the sitemap submitted.
- What must not change during that step: no accounts, streaks or lesson locking unless the owner asks.

## Commands

- Startup: `./init.sh`
- Verification: `npm run verify` · `npm run e2e`
- Focused debug command: `npx playwright test e2e/seo.spec.ts -c apps/web/playwright.config.ts`
