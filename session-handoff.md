# Session Handoff

## Verified Now

- **Repository:** GitHub `socheek-del/chaturanga` (renamed from `Makruk`; the old URL redirects). It is a family of games:
  - Makruk (Thai chess) is live.
  - The Sittuyin (Burmese chess) rules engine is done.
  - Plan: `docs/PLATFORM.md`.
- **Layout:**
  - `apps/makruk/{web,worker}`: the Makruk product.
  - `packages/rules-core`: Variant interface and conformance suite.
  - `packages/makruk`, `packages/sittuyin`: rules engines, each with a `RULES.md`.
  - `packages/ai`: Makruk AI.
  - `packages/protocol`.
  - Scope `@chaturanga/*`.
- **Makruk site:** behaviour unchanged. The site address lives in `apps/makruk/web/site.config.ts`.
- **Verification that ran on the new layout:**
  - `npm run verify` exit 0
  - `npm run build` OK
  - `npm run e2e` 65/65 on a re-run
  - `npm run e2e:pwa -w apps/makruk/web` 2/2
  - Deep rules runs for both engines (before the move).
- **CI and production:**
  - Run 34820113721 on 1c3f632: verify and deploy both succeeded.
  - Production pages and health returned 200, and the JSON-LD links to the chaturanga repo.
  - A Playwright smoke test against production passed (bot game reply, online room with 2 moves).

## Changed This Session

- **Plan:** plat-001.
- **Sittuyin rules engine:** sit-001..003.
- **rules-core Variant interface:** plat-002.
- **Rename and restructure:** plat-003.
  - Root README, CONTRIBUTING and AGENTS now describe the platform.
  - Makruk facts are in `apps/makruk/AGENTS.md`.
  - Every feature has a `product` field.

## Broken Or Unverified

- **Known defect:** none open.
- **Flaky test:** E2E online-004 ("a player who reloads rejoins") timed out once under full-suite load because the opponent-disconnected bar's button covered square d6. It passes alone (3/3) and on re-run. Harden it if it recurs.
- **Unverified path:** no app uses Sittuyin yet.
- **Risk:** run npm and vitest under the `.nvmrc` Node (`. ~/.nvm/nvm.sh && nvm use`). With the shell's default Node 20.13, npm skips native bindings and vitest fails.

## Next Best Step

- **Highest-priority unfinished feature:** `plat-004`, per-product languages.
- **Why it is next:** the Sittuyin app needs Burmese + English while Makruk stays Thai + English, loading only its own locales.
- **What counts as passing:**
  - A `product.config` declares locales, default and fonts.
  - The locale test fails on any missing key in any declared locale.
  - The Makruk i18n E2E is unchanged.
  - The Makruk build contains no Burmese strings.
- **What must not change:** Makruk behaviour, the worker name and D1 database `makruk`, and the no-accounts / open-lessons decisions.

## Commands

- Startup: `./init.sh`
- Verification: `npm run verify` · `npm run e2e` · `npm run e2e:pwa -w apps/makruk/web`
- Deep rules checks: `npm run test:deep -w packages/makruk` · `npm run test:deep -w packages/sittuyin`
