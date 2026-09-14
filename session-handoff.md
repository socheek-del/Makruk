# Session Handoff

## Verified Now

- **Repository:** `socheek-del/chaturanga`, a family of games.
  - Makruk (Thai chess) is live and unchanged for players.
  - Sittuyin (Burmese chess) is being built. Plan: `apps/sittuyin/docs/PLAN.md`.
- **Shared packages:**

  | Package | Contents |
  |---|---|
  | `rules-core` | Variant interface and conformance suite |
  | `makruk`, `sittuyin` | Rules engines verified against Fairy-Stockfish |
  | `ai-core` | Shared search |
  | `ai` (Makruk bots), `sittuyin-ai` | Bots |
  | `game-shell` | ProductConfig, per-product languages, SEO helpers, `describeLocales` |
  | `board-ui` | Board of any size, HandTray, useMoveInput with drops and promotion |
  | `protocol` | Message schemas |

- **Makruk migration:** the app runs on game-shell (languages) and board-ui (board and move input). Verified with `npm run verify`, build, E2E 65/65 and PWA 2/2; plat-004 also on production (CI green, live HTML checked).
- **Sittuyin bot ladder on GitHub Actions:** pairs 1–4 pass (+20-0=0, +16-3=1, +15-0=5, +18-0=2). Pair 5 (L6 vs L5, run 34823317321) is still running when this was written.

## Changed This Session (latest part)

- Wrote the Sittuyin implementation plan.
- sit-004: ai-core + sittuyin-ai + ladder workflow `package` input (in progress, waiting for pair 5).
- plat-004: per-product languages (passing).
- plat-005 slice a: board-ui with Makruk migrated (plat-005 in progress).

## Broken Or Unverified

- **Known defect:** none open.
- **Pending evidence:**
  - Sittuyin ladder pair 5. If it fails, tune the L6/L5 budgets in `packages/sittuyin-ai/src/bots.ts` and re-dispatch: `gh workflow run strength.yml -f package=packages/sittuyin-ai -f pair=5 -f games=20`.
  - HandTray and the promotion marker are unit-tested only; no app shows them yet (the Sittuyin app will).
- **Known flake:** E2E online-004 (reload rejoins) can time out under load when the disconnect bar covers the board. It passes on re-run.
- **Risks:**
  - Run npm and vitest under the `.nvmrc` Node (`. ~/.nvm/nvm.sh && nvm use`).
  - `gh` is logged in as another account by default; use `GH_TOKEN=$(gh auth token -u socheek-del)` for this repo.
  - The context-mode hook blocks inline HTTP in shell commands; put fetch checks in a script file.

## Next Best Step

- **Feature:** `plat-005` slice b, in three steps, each verified by the full Makruk E2E suite:
  1. b1: clock math into rules-core; generic `result.ts` (adds `fifty-move`); a session factory on a Variant whose clock starts after the setup phase.
  2. b2: `components/ui` into a shared ui package.
  3. b3: GameScreen with board, hand trays, sounds and settings injected.
- **Owner decisions needed:**
  - Sittuyin design direction (sit-005) before the Sittuyin app is styled.
  - The Sittuyin subdomain (sit-009).
- **Must not change:** Makruk behaviour, Worker and D1 names, and the no-accounts / open-lessons decisions.

## Commands

- Startup: `./init.sh`
- Verification: `npm run verify` · `npm run e2e` · `npm run e2e:pwa -w apps/makruk/web`
- Deep rules checks: `npm run test:deep -w packages/makruk` · `npm run test:deep -w packages/sittuyin`
- Ladders: `gh workflow run strength.yml -f package=packages/ai|packages/sittuyin-ai -f pair=N -f games=20`
