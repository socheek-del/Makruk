# Quality Document

A quality snapshot for each product domain and architectural layer. Both agents
and humans use this document to see where the codebase is strong and where it
needs work.

**Update cadence:** After each significant session, or before starting a new milestone.

**Grading scale:**

- **A**: All verification passing, clean architecture, agent-legible, stable tests
- **B**: Verification passing, mostly clean, minor gaps in legibility or test coverage
- **C**: Partially working, known gaps, some code areas hard for agents to understand
- **D**: Not working, or major structural issues

---

## Product Domains

| Domain | Grade | Verification | Agent Legibility | Test Stability | Key Gaps | Last Updated |
|--------|-------|-------------|-----------------|---------------|----------|-------------|
| Rules engine (Makruk) | A | Unit + perft + lock-step vs Fairy-Stockfish | docs/rules.md, typed API | Deterministic seeds | Array-scan movegen limits AI depth | 2026-09-13 |
| Local play & pass-and-play | A | Unit + E2E (moves, history, views, clocks) | GameScreen shared by all modes | Stable; fake clock for timers | — | 2026-09-13 |
| Single player (AI) | A | Unit (tactics, repetition incl. opponent reply, root window, conversion) + E2E (worker, hints, takeback) + 20-game ladder per level pair on Actions | search/evaluate/bots split; ladder logs end reason + FEN per game | Ladder deterministic (node budgets, seeded openings); ~2 h for L6 vs L5 on Actions | No transposition table; Met-only mates vs bare Khun sometimes run out the count; browser strength follows time budgets, ladder follows node budgets | 2026-09-13 |
| Tutorials & gamification | A | Lesson content validated against engine; E2E lesson/path/guided | Lessons are plain TS data | Fake clock for streaks | Content reviewed by engineer, not a Makruk teacher | 2026-09-13 |
| Online play | A | Pure room logic + workerd DO tests + two-browser E2E | Thin DO over pure reducer | Real wrangler dev in E2E | No spectator UI beyond read-only banner | 2026-09-13 |
| Accounts & ratings | B | Glicko-2 reference test, workerd tests (register/confirm/login/lockout/reset, mocked Resend), E2E full account flow via dev outbox + rated game + guest carry-over | accounts/{routes,store,password,email}.ts | Local D1 via wrangler in E2E | Production email unverified (no Resend key); no per-IP rate limit on register/forgot-password | 2026-09-13 |
| Themes & art | A | E2E + screenshot review | pieces/ folder, Mascot.tsx | — | Ruea/Khun silhouettes close at 36px | 2026-09-13 |
| Localization (TH/EN) | B | Key parity + literal-key test; E2E in both languages | locales/*.json + lesson L10n | — | Needs native Thai review (polish-002) | 2026-09-13 |
| PWA & polish | A | Installability via CDP, offline E2E, sound/motion E2E | vite.config.ts, sound.ts | — | — | 2026-09-13 |

## Architectural Layers

| Layer | Grade | Boundary Enforcement | Agent Legibility | Key Gaps | Last Updated |
|-------|-------|---------------------|-----------------|----------|-------------|
| `packages/engine` | A | ESLint no-restricted-globals for src; clock is pure (`now` injected) | board, movegen, fen, game, clock, perft | ffish is devDependency only | 2026-09-13 |
| `packages/ai` | B | Uses `@makruk/engine/core` only | search/evaluate/bots/index | Strength ladder slow | 2026-09-13 |
| `packages/protocol` | A | Zod schemas only | game.ts | — | 2026-09-13 |
| `apps/web` | A | No rules logic outside engine; sessions share one interface | features/, pages/, stores/ | Bundle not code-split per route | 2026-09-13 |
| `apps/worker` | A | All moves validated via engine; room rules are pure functions; dev email outbox only when DEV_EMAIL_OUTBOX=1 | room/, match/, accounts/, ratings/ | — | 2026-09-13 |
| CI & deploy | A | verify + deploy on main; scoped token; AUTH_SECRET as secret | .github/workflows/ci.yml | E2E not run in CI (needs browsers + wrangler) | 2026-09-13 |

## Change History

### 2026-09-13

- Changes: M0–M5 and most of M7 implemented and verified; see claude-progress.md.
- Domains promoted: engine, local play, tutorials, online, themes & art, PWA → A; AI and i18n → B
- Domains demoted: none
- New gaps identified: bot ladder counting-rule draws (fixed, re-running); native Thai review; accounts
- Gaps closed: page scroll on move, coach tip after resignation, repetition shuffling in bots
