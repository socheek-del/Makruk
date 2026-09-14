# AGENTS.md: Sittuyin

Sittuyin (စစ်တုရင်, Burmese chess) is a web PWA. It offers:

- single player against six computer opponents
- pass-and-play
- online play by room code or quick match
- interactive lessons
- its own "Daung" (peacock) design identity (`apps/sittuyin/docs/design.md`)

The product plan is `apps/sittuyin/docs/PLAN.md`. The platform rules in the root `AGENTS.md` apply here too.

## Sittuyin Facts

- **Code:**
  - rules: `packages/sittuyin` (`@chaturanga/sittuyin`), documented in `packages/sittuyin/RULES.md`
  - AI: `packages/sittuyin-ai` (`@chaturanga/sittuyin-ai`)
  - web app: `apps/sittuyin/web` (`@chaturanga/sittuyin-web`)
  - Cloudflare Worker: `apps/sittuyin/worker` (`@chaturanga/sittuyin-worker`). It serves static assets,
    `/api/*`, `/ws/*`, the Durable Objects `GameRoom` and `Matchmaker`, and D1 `sittuyin` (finished games).
- **Language:** Burmese (`my`, Unicode only, never Zawgyi) is the default; English is the alternative. Every
  user-visible string needs both. Native review: `apps/sittuyin/docs/i18n-review.md` (sit-011).
- **Rules reference:** start `8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KFRRSSNNkfrrssnn] w - - 0 1`. The game opens with
  a 16-ply setup phase; clocks do not run until it ends (local, computer and online). Rule questions are
  settled against Fairy-Stockfish's `sittuyin` variant.
- **Site address:** the domain is temporary, so never hardcode it.
  - Web code reads `SITE_URL` from `apps/sittuyin/web/site.config.ts` (override: `SITTUYIN_SITE_URL`). It is
    injected as `__SITE_URL__` and `%SITE_URL%`; robots.txt and sitemap.xml are generated from it.
  - The only other places are `routes` in `apps/sittuyin/worker/wrangler.jsonc` and the `[play]` link at the
    bottom of `apps/sittuyin/README.md` / `README.my.md`.
  - README media: `BASE_URL=<live site> npm run capture:readme -w apps/sittuyin/web` (needs ffmpeg and
    ImageMagick); it never films a screen that shows the address.
- **Deploy:**
  - GitHub Actions job `deploy-sittuyin` runs on push to `main` when Sittuyin's folders, a shared package or
    the lock file changed.
  - `npm run deploy:sittuyin` applies D1 migrations (`apps/sittuyin/worker/migrations`) first.
  - Secret `AUTH_SECRET` on the `sittuyin` Worker signs seat tokens (`wrangler secret put AUTH_SECRET` in
    `apps/sittuyin/worker`). Local dev reads it from the gitignored `.dev.vars`.
- **Dev and tests:**
  - `npm run dev:sittuyin` runs the Worker on :8788 and the web app (it proxies `/api` and `/ws`).
  - `npm run e2e -w apps/sittuyin/web` starts vite + wrangler dev with a local D1.
  - `npm run e2e:pwa -w apps/sittuyin/web` checks installability and offline play on a production build.
  - `npm run capture -w apps/sittuyin/web` re-takes the review screenshots in `apps/sittuyin/docs/evidence`.
  - `npm run icons -w apps/sittuyin/web` re-renders the PWA icons and the Open Graph image.
- **Fixtures:** a position with only kings plus a Sit-ke is insufficient material and ends at once; keep a Ne
  on the board when a test needs the game to go on.
