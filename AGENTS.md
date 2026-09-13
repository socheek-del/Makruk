# AGENTS.md

Makruk (Thai chess) — web PWA with single player, pass-and-play, online play,
Duolingo-style tutorials and themes. Full product plan: `docs/PLAN.md`.

This repository is designed for long-running coding-agent work. The goal is not
to maximize raw code output. The goal is to leave the repo in a state where the
next session can continue without guessing.

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd` (repo root contains `feature_list.json`).
2. Read `claude-progress.md` for the latest verified state and next step.
3. Read `feature_list.json` and choose the highest-priority unfinished feature.
4. Review recent commits with `git log --oneline -5`.
5. Run `./init.sh` (installs deps, runs `npm run verify`).
6. Run the smoke / end-to-end verification relevant to the area before new work.

If baseline verification is already failing, fix that first. Do not stack new
feature work on top of a broken starting state.

## Working Rules

- Work on one feature at a time (`single_active_feature`).
- Do not mark a feature `passing` just because code was added — run its
  `verification` steps and record `evidence`.
- Keep changes within the selected feature scope unless a blocker forces a
  narrow supporting fix.
- Do not silently change verification rules, weaken tests, or rewrite the
  feature list to hide unfinished work.
- Prefer durable repo artifacts over chat summaries.

## Project Facts

- **Stack:** npm workspaces · TypeScript · React 19 + Vite · Tailwind v4 ·
  Cloudflare Workers + Durable Objects + D1 · Vitest · Playwright.
- **Node:** version in `.nvmrc` (`nvm use`).
- **Layout:**
  - `packages/engine` — pure Makruk rules. No DOM, no network, no randomness
    without an injected seed. Single source of truth used by web, AI and worker.
  - `packages/ai` — search/eval, runs in a Web Worker (created in M3).
  - `packages/protocol` — Zod schemas for REST + WebSocket messages.
  - `apps/web` — React PWA.
  - `apps/worker` — Cloudflare Worker: static assets, `/api/*`, `/ws/*`, Durable Objects, D1.
- **Commands:** `npm run dev` · `npm run verify` (lint + typecheck + unit tests) ·
  `npm run e2e` · `npm run build` · `npm run deploy`.
- **Language:** Thai is the default UI language; English is the alternative.
  Every user-visible string goes through i18n keys (`th` and `en` both required).
- **Product constraints:** no chat of any kind in online play. Server validates
  every online move with `packages/engine`.
- **Rules reference:** Makruk start FEN `rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1`.
  Rule questions are settled against Fairy-Stockfish's `makruk` variant.
- **License:** GPL-3.0 (public repo; Fairy-Stockfish WASM is allowed).
- **Source control:** remote `git@github-socheek-del:socheek-del/Makruk.git`.
  Branch `main`. Conventional Commits.
- **Deploy:** production at `https://th-chess.beanroti.com` (Worker custom domain
  on Cloudflare zone `beanroti.com`). GitHub Actions deploys on push to `main`;
  `npm run deploy` applies D1 migrations (`apps/worker/migrations`) first.
- **Worker config:** secrets `AUTH_SECRET` (required), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
  and `RESEND_API_KEY`/`EMAIL_FROM` (sign-in providers, disabled until set). `ALLOW_TEST_LOGIN=1`
  enables `/api/auth/test-login` — only for local dev, workerd tests and Playwright; never in production.
- **Tests:** worker tests run inside workerd (`@cloudflare/vitest-plugin`, D1 migrations applied in
  `apps/worker/test/apply-migrations.ts`); `npm run e2e` starts vite + wrangler dev with local D1;
  `npm run e2e:pwa -w apps/web` checks installability/offline on a production build; the bot ladder
  (`npm run test:strength -w packages/ai`) is slow and writes results to `packages/ai/strength-results.log`.

## Required Artifacts

- `feature_list.json`: source of truth for feature state
- `claude-progress.md`: session log and current verified status
- `init.sh`: standard startup and verification path
- `session-handoff.md`: compact handoff for larger sessions
- `clean-state-checklist.md`: run before ending a session
- `evaluator-rubric.md`: score a feature before accepting it
- `quality-document.md`: per-area quality grades

## Definition Of Done

A feature is done only when all of the following are true:

- the target behavior is implemented
- the required verification actually ran
- evidence is recorded in `feature_list.json` or `claude-progress.md`
- the repository remains restartable from the standard startup path

## End Of Session

Before ending a session:

1. Update `claude-progress.md`.
2. Update `feature_list.json`.
3. Record any unresolved risk or blocker.
4. Walk through `clean-state-checklist.md`.
5. Commit with a descriptive message once the work is in a safe state.
6. Leave the repo clean enough for the next session to run `./init.sh`
   immediately.
