# Progress Log

<!--
Filename kept for compatibility with the harness-engineering templates. The
file is agent-agnostic. Read it at session startup and update it before
handoff; no agent updates it automatically.
-->

## Current Verified State

- Repository root: `t-chess/` (GitHub `socheek-del/chaturanga`, renamed from `Makruk` on 2026-09-14, public, GPL-3.0). Makruk product in `apps/makruk/{web,worker}`, rules in `packages/makruk`.
- Production: https://th-chess.beanroti.com — Worker `makruk` (static assets + `/api/*` + `/ws/*`, Durable Objects `GameRoom`, `Matchmaker`), auto-deployed by GitHub Actions on push to `main`
- Standard startup path: `./init.sh` then `npm run dev` (web :5173 proxies to wrangler :8787)
- Standard verification path: `npm run verify` (lint + typecheck + unit tests in all workspaces, incl. workerd tests)
- E2E: `npm run e2e` (Playwright starts vite + wrangler dev) · PWA/offline: `npm run e2e:pwa -w apps/makruk/web`
- Deep engine checks: `npm run test:deep -w packages/makruk` · `npm run test:deep -w packages/sittuyin` · Bot ladder: `npm run test:strength -w packages/ai` (slow; `STRENGTH_PAIR=n`)
- Milestones: M0 infra ✓, M1 engine ✓, M2 local play ✓, M3 vs computer ✓ (ai-002 ladder verified on GitHub Actions), M4 learning ✓, M5 online ✓ (incl. quick match), M6 accounts (acct-001 anonymous seat token ✓; acct-002/acct-003 deferred — accounts removed by the owner), M8 owner requests (play-006, about-001, docs-001 ✓; seo-001 awaiting Search Console), M7 polish (PWA, sounds, themes, art ✓; polish-002 blocked)
- D1 database `makruk` (id 9e084ac6-9749-411d-867d-c89e8421ed78); migrations in `apps/makruk/worker/migrations`, applied by `npm run deploy` (CI) and by the Playwright wrangler command locally
- Remaining: `polish-002` (native Thai review) and `seo-001` (Search Console submission) — both need the owner; `acct-002`/`acct-003` deferred (accounts removed from the product for now)
- Multi-game platform (session 003): plan in `docs/PLATFORM.md` (repo → `chaturanga`, one product per game on its own subdomain, Sittuyin next in Burmese + English). `packages/sittuyin` engine complete (M9): sit-001 ✓ setup, sit-002 ✓ moves + promotion, sit-003 ✓ game end + ASEAN counting (`docs/sittuyin-rules.md`). plat-002: `packages/rules-core` holds the Variant interface and shared 8x8 code, and both engines pass its conformance suite. plat-003: the repo is renamed to chaturanga, Makruk lives in `apps/makruk`, and the scope is `@chaturanga/*`. Next: plat-004 (per-product languages).
- Shell pitfall: run npm/vitest under the `.nvmrc` Node (`. ~/.nvm/nvm.sh && nvm use`). The default shell Node 20.13 makes npm skip rolldown's native binding, and vitest then fails with "Cannot find native binding". `init.sh` already switches Node.
- Current blockers (owner action needed):
  - `seo-001`: verify the site in Google Search Console and submit `https://th-chess.beanroti.com/sitemap.xml`
  - `polish-002`: native Thai reviewer completes `docs/i18n-review.md`

## Session Log

### Session 001

- Date: 2026-09-13
- Goal: plan the product, set up the harness, then implement every feature in `feature_list.json`.
- Completed:
  - M0: monorepo scaffold, CI, production deploy on th-chess.beanroti.com with a scoped Cloudflare token.
  - M1: Makruk engine verified against Fairy-Stockfish (perft fixtures, lock-step random games, counting rules, insufficient material).
  - M2: design system, Thai-first i18n, board with tap/drag, move list/history/undo, pass-and-play views, clocks with presets, light/dark and board themes.
  - M3: alpha-beta AI in a Web Worker, 6 bot personas, hints and takeback; repetition-aware search with contempt and a "conversion mode" for won endgames.
  - M4: data-driven lessons (10 piece/rule lessons + counting lesson), guided first game with coach, lesson path with XP (the daily streak was removed later at the owner's request; the path was restyled as a temple stairway in the 2026-09-14 Wat redesign).
  - M5: guest identity, GameRoom Durable Object (server validation, clocks, alarms, hibernation, reconnect/abandon, draw/resign/rematch), web client, quick-match Matchmaker.
  - M7: installable offline PWA, synthesized sounds + haptics + move animation, final classic piece set, flat set, mascot.
- Verification run: see evidence per feature in `feature_list.json` (unit: engine 129, ai 18, web 105, worker 30; E2E 59 + PWA 2).
- Commits: through `f021315` (CI verify + deploy green).
- Known risk or unresolved issue:
  - Bot ladder originally failed on counting-rule draws (strong side could not mate before the count ran out); fixed with conversion mode; re-run in progress.
  - npm 10 crashes on this dependency tree → use npm 11 (`init.sh`, CI).
  - ffish needs `globalThis.fetch` hidden in Node 22 (`packages/engine/src/testing/ffish.ts`).
  - Vitest swallows console output of passing tests: slow tests write results to files (`packages/ai/strength-results.log`, gitignored).
- Later in session: accounts reworked to username + password (PBKDF2), email confirmation before sign-in, email password reset, lockout after 10 failures; `DEV_EMAIL_OUTBOX=1` lets tests and local dev read emails from D1.
- Later in session: `ai-002` verified. The local ladder kept getting killed under memory pressure, so it moved to an on-demand GitHub Actions workflow (`.github/workflows/strength.yml`: 5 runners × 4 shards, resumable per-game log, verdict job). Findings and fixes along the way: noise-free bots replayed identical games (→ seeded paired openings); weaker bots could force repetition (→ search checks the opponent's reply against history); full-window root search wasted L6's budget (→ exact root scores only for noisy bots, L6 depth cap 8); won endgames drew on the count (→ trade-down bonus); L4 too close to L5 (→ L4 noise 30, 2% random moves). Final ladder: +19-0=1, +19-1=0, +18-0=2, +17-0=3, +14-0=6.
- Next best step: native Thai review for `polish-002`; Search Console for `seo-001`.

### Session 002

- Date: 2026-09-14
- Goal: owner requests — games survive refresh, language remembered without an account, remove streaks,
  remove accounts/identity (open to all, all lessons unlocked), About page with GitHub contribution links,
  SEO, and a showcase README.
- Completed:
  - `play-006`: local/computer/guided games saved in localStorage and rebuilt on load; computer bot resumes.
  - Language already persisted per browser (verified on production); settings store gained a migrate step.
  - Daily streak removed (progress v2 migration); all lessons open.
  - Accounts, ratings, history, replay and rated toggle removed from the web app (`acct-002`/`acct-003`
    deferred; worker code dormant); online players shown as You / Opponent.
  - `about-001`: About page + CONTRIBUTING.md.
  - `seo-001`: per-page Thai/English titles and descriptions, canonical + hreflang (`?lang=en`), OG image,
    JSON-LD, robots.txt, sitemap.xml, crawler fallback content — verified on production.
  - `docs-001`: README with GIF demos captured from production; the capture review found and fixed
    white-on-white lesson unit banners.
- Verification run: web unit 110; full E2E 65/65 (plus focused re-runs); CI verify + deploy green through 248b653.
- Known risk: SEO ranking depends on Search Console submission and time; README media must be re-captured when the UI changes.
- Later the same day:
  - Search Console domain property verified by the owner; sitemap read (Success, 12 pages); IndexNow submissions accepted; GitHub repo homepage/description/topics set; crawlable Makruk intro added to the home page.
  - Domain made configurable (`apps/web/site.config.ts`); no domain in images, GIFs or README badges; README.th.md added.
  - "Wat" redesign replaced the Duolingo-like look (legal risk flagged by the owner): own palette, Prompt font, pill buttons, temple-stairway lessons, recoloured icons and mascot; docs/design.md rewritten; full E2E 65/65.

### Session 003

- Date: 2026-09-14
- Goal: plan a multi-game monorepo (owner wants Sittuyin, Shogi and others without rebuilding everything or mixing products), then start Sittuyin.
- Owner decisions:
  - Monorepo renamed to `chaturanga`.
  - Subdomains for now.
  - Sittuyin first, in Burmese + English.
  - Nothing game-specific at the root or in shared packages.
- Completed:
  - `plat-001`: `docs/PLATFORM.md` and features sit-001..011 / plat-002..006 (commit 7408fb1).
  - `sit-001`: `packages/sittuyin` with FEN, pieces in hand and the setup phase, verified against ffish `sittuyin` (100 setups in verify, 400 deep).
- Verification run: `npm run verify` exit 0 (web 112, worker 48, ai 20, engine 129, protocol 2, sittuyin 52); `npm run test:deep -w packages/sittuyin` 52 passed.
- Known risk or unresolved issue:
  - The shell's default Node is 20.13; use nvm (see Current Verified State).
  - Package scope is mixed (`@makruk/*` plus `@chaturanga/sittuyin`) until plat-003.
- Later in session: `sit-002` — move generation and Ne promotion verified against ffish (perft reference for 13 positions, lock-step full games). The promotion rules came from ffish probes; `packages/sittuyin/src/movegen.test.ts` lists each probed case.
- Later in session: `sit-003` — Sittuyin game end, including ASEAN counting and the 50-move rule, documented in `docs/sittuyin-rules.md`. Lock-step games now compare the full FEN and game over. They found one real counting bug (a bare-king capture cleared the count); it is fixed. Deep run 165/165; verify exit 0.
- Not pushed: commits 7408fb1..HEAD are local only. A push to `main` triggers the CI deploy (Makruk is unaffected, but ask the owner first).
- Owner approved the plan and asked to start implementation (push question still unanswered, so nothing pushed).
- `plat-002`: `packages/rules-core` created.
  - The Variant interface was designed from a survey of the Game calls in the web app and worker.
  - Both engines satisfy it at compile time and pass the shared conformance suite. A mutation check (an undo that does nothing) proved the suite catches violations.
  - Makruk re-exports the moved code under its old names, so the ai, web and worker packages did not change.
  - Verification: verify, deep runs for both engines, build, E2E. Results are in `feature_list.json`.
- Owner answered: push now, and do all of plat-003 including the GitHub rename.
- Pushed 7408fb1..5e5921f. CI verify + deploy succeeded, and the production home page and `/api/health` returned 200.
- `plat-003` (commit 1c3f632):
  - Moved the Makruk app, rules engine and docs into product folders, and renamed the scope to `@chaturanga/*`.
  - Split the root and Makruk README, CONTRIBUTING and AGENTS files, and added `product` to all features.
  - Verification: verify, build, e2e:pwa, and E2E 65/65 on a re-run (the first run had one timing flake, recorded in the evidence).
  - Renamed the GitHub repo to `chaturanga` and updated the remote, description and topics, then pushed.
- Known flake: in E2E online-004 (reload rejoins), the opponent-disconnected bar can cover the board under full-suite load. It passes alone and on re-run. Worth hardening if it recurs.
- Owner asked for a detailed Sittuyin implementation plan and to start implementing.
- `apps/sittuyin/docs/PLAN.md` written.
  - Product defaults: setup UX with hand trays and Auto-arrange, clocks start after setup, a Promote chip for in-place promotion, Noto Sans Myanmar, six bots, a separate Worker and D1.
  - Seams found by an inventory of the Makruk web app and worker.
  - A 10-step work breakdown mapped to sit-004..011 and plat-004..006.
  - One inventory claim checked and rejected: that the index.html JSON-LD has a missing comma. It is valid.
- `sit-004` in progress.
  - `@chaturanga/ai-core` (Makruk search ported behind a `SearchAdapter`, 11 tests on Nim).
  - `@chaturanga/sittuyin-ai` (adapter, evaluation, setup policy, 6 bots, 21 tests, strength ladder).
  - `strength.yml` gained a `package` input.
  - The Sittuyin engine got a `/core` export plus `encodedToUci`, and promotion generation no longer allocates. Its tests are unchanged and passing.
  - Benchmark: Sittuyin search about 55k nodes/s vs Makruk 90–110k at the same budget.
- Local ladder preview: L2 > L1 +20-0=0; L3 > L2 +16-3=1. Actions runs were dispatched for all 5 pairs; pairs 1–4 passed (verdicts in sit-004 notes once pair 5 finishes).
- `plat-004` passing.
  - Built while the ladder ran on Actions, not locally.
  - `@chaturanga/game-shell` holds the product config, locale helpers, SEO tags and `describeLocales`.
  - Makruk is driven by `apps/makruk/web/product.config.ts`.
  - Build ships 0 Myanmar characters, sitemap identical to production, E2E 65/65, PWA 2/2, verify green.
- plat-004 is live on production: CI run 34824222210 green, and production home shows `lang=th`, the `makruk.settings` key and locales `["th","en"]`.
- `plat-005` slice a (board) is done.
  - `@chaturanga/board-ui` provides Board, HandTray and useMoveInput with drops and promotion, 18 tests.
  - Makruk is migrated onto it.
  - Web unit 109, E2E 65/65, PWA 2/2; built CSS contains the board-ui classes.
- board-ui on production: CI run 34825066575 green, and the production smoke test passed (bot game, online room).
- `plat-005` slice b1 (sessions) done.
  - Clock arithmetic moved to rules-core.
  - game-shell gained results with `fifty-move`, time controls, and `createGameSession(variant)`, whose clock is setup-aware. 15 tests.
  - Makruk's session, result and time-control modules are now wrappers over game-shell.
- plat-005 stays `in_progress`.
- Next best step:
  - Record the sit-004 pair 5 verdict when run 34823317321 finishes.
  - Continue plat-005 slice b in three steps, each verified by the full Makruk E2E suite:
    - b1: clock math into rules-core; generic `result.ts` with `fifty-move`; a session factory on a Variant whose clock starts after setup.
    - b2: `components/ui` into a shared ui package.
    - b3: GameScreen with the board, hand trays, sounds and settings injected.
  - Owner decision still open for sit-005: the Sittuyin design direction.
