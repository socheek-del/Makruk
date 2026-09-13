# Progress Log

<!--
Filename kept for compatibility with the harness-engineering templates. The
file is agent-agnostic. Read it at session startup and update it before
handoff; no agent updates it automatically.
-->

## Current Verified State

- Repository root: `t-chess/` (GitHub `socheek-del/Makruk`)
- Standard startup path: `./init.sh` then `npm run dev`
- Standard verification path: `npm run verify` (lint + typecheck + unit tests); `npm run e2e` for Playwright
- Production: https://th-chess.beanroti.com (Worker `makruk`; auto-deployed by GitHub Actions on push to `main`; manual fallback `npm run deploy`)
- Milestone: M0 complete (`infra-001..003`); M1 rules engine complete (`engine-001..006`)
- Deep engine verification: `npm run test:deep -w packages/engine` (perft depth 5 + 400 lock-step games vs Fairy-Stockfish)
- Current highest-priority unfinished feature: `design-001` design system foundation
- Current blocker: none

## Session Log

### Session 001

- Date: 2026-09-13
- Goal: Brainstorm + plan the product; set up harness; start M0 (scaffold, CI, deploy placeholder to th-chess.beanroti.com).
- Completed: `docs/PLAN.md`; harness files; `git init`; `infra-001` monorepo scaffold (web placeholder with TH/EN toggle, worker `/api/health`, engine + protocol packages, CI workflow file, GPL-3.0 LICENSE).
- Verification run: `npm run verify`, `npm run build`, dev-server smoke (see `feature_list.json` infra-001 evidence).
- Evidence captured: recorded in `feature_list.json`.
- Commits: initial scaffold commit.
- Files or artifacts updated: see above
- Known risk or unresolved issue: npm 10.9.8 crashes on install (arborist `#loadPeerSet`) → `init.sh` and CI use npm 11. `gh` CLI logged in as another account; repo creation needs `socheek-del` auth. Wrangler needs Cloudflare auth.
- Update (same session): repo `socheek-del/Makruk` created (public) and pushed; CI run 34736916479 green (`infra-002` passing). Deployed to th-chess.beanroti.com and verified over HTTPS (`infra-003` in progress).
- Update (same session): created scoped Cloudflare account API token (expires 2027-09-14) → repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; added CI `deploy` job; run 34737557818 deployed successfully (`infra-003` passing). M0 complete.
- Update (same session, M1): Makruk engine in `packages/engine` (numeric board, movegen, FEN, Game with SAN/undo/status/counting/insufficient material, perft). Verified against Fairy-Stockfish via ffish (test-only dep): perft fixtures + lock-step random games. Rules documented in `docs/rules.md`.
- Gotchas: ffish needs `globalThis.fetch` hidden while loading in Node 22 (`src/testing/ffish.ts`); Fairy-Stockfish FEN omits the `~` promoted marker (normalize before comparing).
- Next best step: M2 — `design-001` (tokens + components), then `i18n-001`, `play-001..005`, `theme-001`.
