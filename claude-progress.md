# Progress Log

<!--
Filename kept for compatibility with the harness-engineering templates. The
file is agent-agnostic. Read it at session startup and update it before
handoff; no agent updates it automatically.
-->

## Current Verified State

- Repository root: `t-chess/` (GitHub `socheek-del/Makruk`, public, GPL-3.0)
- Production: https://th-chess.beanroti.com — Worker `makruk` (static assets + `/api/*` + `/ws/*`, Durable Objects `GameRoom`, `Matchmaker`), auto-deployed by GitHub Actions on push to `main`
- Standard startup path: `./init.sh` then `npm run dev` (web :5173 proxies to wrangler :8787)
- Standard verification path: `npm run verify` (lint + typecheck + unit tests in all workspaces, incl. workerd tests)
- E2E: `npm run e2e` (Playwright starts vite + wrangler dev) · PWA/offline: `npm run e2e:pwa -w apps/web`
- Deep engine checks: `npm run test:deep -w packages/engine` · Bot ladder: `npm run test:strength -w packages/ai` (slow; `STRENGTH_PAIR=n`)
- Milestones: M0 infra ✓, M1 engine ✓, M2 local play ✓, M3 vs computer (ai-001, ai-003 ✓; ai-002 ladder final pairs running), M4 learning ✓, M5 online ✓ (incl. quick match), M6 accounts (acct-001, acct-003 ✓; acct-002 blocked), M7 polish (PWA, sounds, themes, art ✓; polish-002 blocked)
- D1 database `makruk` (id 9e084ac6-9749-411d-867d-c89e8421ed78); migrations in `apps/worker/migrations`, applied by `npm run deploy` (CI) and by the Playwright wrangler command locally
- Remaining: `ai-002` (ladder evidence), `acct-002` (production verification), `polish-002` (human review)
- Current blockers (owner action needed):
  - `acct-002`: create a Google OAuth web client (redirect URI `https://th-chess.beanroti.com/api/auth/google/callback`) and a Resend key with beanroti.com verified; set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` with `wrangler secret put` in `apps/worker`
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
  - M4: data-driven lessons (10 piece/rule lessons + counting lesson), guided first game with coach, Duolingo-style path with XP and streaks.
  - M5: guest identity, GameRoom Durable Object (server validation, clocks, alarms, hibernation, reconnect/abandon, draw/resign/rematch), web client, quick-match Matchmaker.
  - M7: installable offline PWA, synthesized sounds + haptics + move animation, final classic piece set, flat set, mascot.
- Verification run: see evidence per feature in `feature_list.json` (unit: engine 129, ai 18, web 105, worker 30; E2E 59 + PWA 2).
- Commits: through `f021315` (CI verify + deploy green).
- Known risk or unresolved issue:
  - Bot ladder originally failed on counting-rule draws (strong side could not mate before the count ran out); fixed with conversion mode; re-run in progress.
  - npm 10 crashes on this dependency tree → use npm 11 (`init.sh`, CI).
  - ffish needs `globalThis.fetch` hidden in Node 22 (`packages/engine/src/testing/ffish.ts`).
  - Vitest swallows console output of passing tests: slow tests write results to files (`packages/ai/strength-results.log`, gitignored).
- Next best step: finish `ai-002` evidence, then `acct-003`/`acct-002` (D1 accounts, magic link, Google OAuth, Glicko-2 ratings, history).
