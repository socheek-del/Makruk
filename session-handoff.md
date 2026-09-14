# Session Handoff

## Verified Now

- **Makruk site:** unchanged and live at the address in `apps/web/site.config.ts`. The full E2E suite passes (65/65) on the refactored engine.
- **Multi-game plan:** in `docs/PLATFORM.md`. Owner decisions:
  - The repo becomes `chaturanga`.
  - Each game is a separate product on its own subdomain.
  - Sittuyin is next, in Burmese + English.
- **Rules engines:**
  - `packages/rules-core` (`@chaturanga/rules-core`) holds the Variant interface, shared 8x8 board/tables/attacks, rule errors, and `/testing` (ffish loader, conformance suite).
  - `packages/engine` (Makruk) and `packages/sittuyin` both satisfy `Variant<Game>` at compile time and pass the conformance suite.
  - The Sittuyin rules engine is complete and verified against Fairy-Stockfish (`docs/sittuyin-rules.md`).
- **Verification that ran:**
  - `npm run verify` green (web 112, worker 48, ai 20, engine 143, protocol 2, rules-core 6, sittuyin 174).
  - Deep runs: engine 152/152, sittuyin 180/180.
  - `npm run build` OK.
  - `npm run e2e` 65/65.

## Changed This Session

- Code or behaviour added:
  - `packages/sittuyin` (setup, moves, promotion, game end, perft)
  - `packages/rules-core` (Variant, board8, attacks, errors, testing)
  - Makruk engine now imports shared code from rules-core and re-exports it under its old names. Its `Game` gained `hand()` and `legalUci()`.
- Harness changes:
  - `docs/PLATFORM.md` and `docs/sittuyin-rules.md`
  - features plat-001..002 and sit-001..003 passing
  - engine purity lint rule covers rules-core and sittuyin
  - `AGENTS.md` layout lists the new packages

## Broken Or Unverified

- **Known defect:** none open.
- **Unverified path:** no app uses Sittuyin yet.
- **Risks for the next session:**
  - Commits since `7408fb1` are **not pushed**. The owner has not answered whether to push (a push to `main` runs the CI deploy).
  - Package scope is mixed (`@makruk/*` and `@chaturanga/*`) until plat-003.
  - Run npm and vitest under the `.nvmrc` Node (`. ~/.nvm/nvm.sh && nvm use`). With the shell's default Node 20.13, npm skips rolldown's native binding and vitest fails.

## Next Best Step

- **Highest-priority unfinished feature:** `plat-003`, rename to chaturanga and move Makruk into `apps/makruk/`.
- **Why it is next:** plat-004/005 and the Sittuyin app need the per-product app layout.
- **Needs the owner:** renaming the GitHub repository (public URL change) and pushing. Confirm before doing it.
- **Survey already done:**
  - About 45 files use `@makruk/`.
  - Repo URL appears in the READMEs, CONTRIBUTING, AboutPage.tsx and about.spec.ts, index.html JSON-LD, AGENTS and PLAN.
  - Moving `apps/web` and `apps/worker` together keeps `../web/dist` (wrangler) and `cwd: '../worker'` (Playwright) valid, but `tsconfig` extends paths, root scripts (`-w apps/web`), the eslint `apps/web/**` glob and the workspaces glob must change.
  - CI workflows only reference `packages/ai`.
- **What counts as passing:** see plat-003 in `feature_list.json` (verify, e2e, e2e:pwa, CI deploy, production smoke).
- **What must not change:** Makruk behaviour, the worker name and D1 database `makruk`, and the no-accounts / open-lessons decisions.

## Commands

- Startup: `./init.sh`
- Verification: `npm run verify` · `npm run e2e`
- Deep rules checks: `npm run test:deep -w packages/engine` · `npm run test:deep -w packages/sittuyin`
- Regenerate the Sittuyin perft reference: `npm run perft:reference -w packages/sittuyin`
