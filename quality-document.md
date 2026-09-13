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
| Rules engine (Makruk) | A | Unit + perft + lock-step vs Fairy-Stockfish | docs/rules.md, typed API | Deterministic seeds | Perft uses array scan (fine for AI depth ≤6, may need bitboards later) | 2026-09-13 |
| Local play & pass-and-play | - | - | - | - | Not started | 2026-09-13 |
| Single player (AI) | - | - | - | - | Not started | 2026-09-13 |
| Tutorials & gamification | - | - | - | - | Not started | 2026-09-13 |
| Online play | - | - | - | - | Not started | 2026-09-13 |
| Accounts & ratings | - | - | - | - | Not started | 2026-09-13 |
| Themes & art | - | - | - | - | Not started | 2026-09-13 |
| Localization (TH/EN) | - | - | - | - | Not started | 2026-09-13 |

## Architectural Layers

| Layer | Grade | Boundary Enforcement | Agent Legibility | Key Gaps | Last Updated |
|-------|-------|---------------------|-----------------|----------|-------------|
| `packages/engine` | A | ESLint no-restricted-globals for src (tests/testing excluded) | Small files: board, movegen, fen, game, perft | ffish is devDependency only | 2026-09-13 |
| `packages/ai` | - | Depends only on engine | - | Not started | 2026-09-13 |
| `packages/protocol` | - | Schemas only, no logic | - | Not started | 2026-09-13 |
| `apps/web` | - | No rules logic outside engine | - | Not started | 2026-09-13 |
| `apps/worker` | - | Validates all moves via engine | - | Not started | 2026-09-13 |
| CI & deploy | B | verify + deploy jobs on push to main; scoped token | Documented in AGENTS.md / PLAN.md | npm 11 workaround; token expires 2027-09-14; no preview environments yet | 2026-09-13 |

## Change History

### 2026-09-13

- Changes: Harness files created; plan written; M0 scaffold, CI and production deploy to th-chess.beanroti.com.
- Domains promoted: CI & deploy → B
- Domains demoted: none
- New gaps identified: everything not started
- Gaps closed: none
