# Session Handoff

## Verified Now

- **Makruk site:** unchanged and live at the address in `apps/web/site.config.ts`. Everyone can play the computer, online (quick match or room link) and pass-and-play, and take the 12 open lessons.
- **Multi-game plan:** in `docs/PLATFORM.md`. Owner decisions:
  - The repo becomes `chaturanga`.
  - Each game is a separate product on its own subdomain.
  - Sittuyin is next, in Burmese + English.
- **Sittuyin rules engine** (`packages/sittuyin`, `@chaturanga/sittuyin`) is complete and verified against Fairy-Stockfish:
  - setup phase with pieces in hand
  - move generation
  - Ne promotion
  - checkmate, stalemate, repetition, 50-move rule, insufficient material, ASEAN counting

  Rules: `docs/sittuyin-rules.md`.
- **Verification that ran:**
  - `npm run verify` exit 0 (web 112, worker 48, ai 20, engine 129, protocol 2, sittuyin 159).
  - `npm run test:deep -w packages/sittuyin` 165/165: perft to every reference depth, plus 400 lock-step games comparing legal moves, SAN, FEN and game over on every ply.

## Changed This Session

- Code or behaviour added:
  - `packages/sittuyin` (FEN, setup drops, movegen, promotion, game end, perft)
  - `scripts/perft-reference.cjs`
  - tests: setup, FEN, movegen, rules, reference, perft
- Harness changes:
  - `docs/PLATFORM.md` and `docs/sittuyin-rules.md`
  - features `plat-001`, `sit-001..011`, `plat-002..006` in `feature_list.json`
  - engine purity lint rule extended to `packages/sittuyin`
  - `AGENTS.md` points to the platform plan

## Broken Or Unverified

- **Known defect:** none open.
- **Unverified path:** nothing in the web app or worker uses Sittuyin yet.
- **Risks for the next session:**
  - Commits since `7408fb1` are not pushed. A push to `main` runs CI deploy; ask the owner.
  - Package scope is mixed (`@makruk/*` and `@chaturanga/sittuyin`) until plat-003.
  - Run npm and vitest under the `.nvmrc` Node (`. ~/.nvm/nvm.sh && nvm use`). With the shell's default Node 20.13, npm skips rolldown's native binding and vitest fails to start.

## Next Best Step

- **Highest-priority unfinished feature:** `plat-002`, the Variant interface in `packages/rules-core`.
- **Why it is next:** two real engines now exist, so the shared interface can be designed from both instead of guessed. plat-003..005 and the Sittuyin app build on it.
- **What counts as passing:**
  - Both engines implement the interface.
  - A shared conformance suite runs against both.
  - The Makruk perft and lock-step suites still pass unchanged.
  - `npm run verify` is green.
- **What must not change during that step:** Makruk behaviour, the Makruk site, and the no-accounts / open-lessons product decisions.

## Commands

- Startup: `./init.sh`
- Verification: `npm run verify` · `npm run e2e`
- Sittuyin deep check: `npm run test:deep -w packages/sittuyin`
- Regenerate the Sittuyin perft reference: `npm run perft:reference -w packages/sittuyin`
