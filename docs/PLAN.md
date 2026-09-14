# Thai Chess (Makruk) — Product & Build Plan

Status: draft for review · Date: 2026-09-13

## 1. Decisions locked

| Topic | Decision |
|---|---|
| Platform | Web PWA — React 19 + TypeScript + Vite (installable on phone/desktop) |
| Online backend | Cloudflare Workers + Durable Objects (WebSocket game rooms) + D1 (SQLite) |
| Rules | Makruk only (standard Thai rules incl. counting rules) |
| Identity | Guest play instantly; optional sign-in to keep rating/history |
| Language | **Thai default**, English as option (i18n from day one, not bolted on) |
| Deploy | `th-chess.beanroti.com` — Worker custom domain on existing `beanroti.com` zone |
| Source control | GitHub `socheek-del/Makruk` via SSH alias → `git@github-socheek-del:socheek-del/Makruk.git` |
| Design direction | Duolingo-style playful, gamified learning UI + Chess.com-style clean game/board UI; all illustrations & piece art made in-house |
| Sign-in | Username + password, email confirmation, email password reset (optional; guest by default). No Google sign-in. |
| Chat | None — no free text, no chat of any kind in online games |
| Time controls | Quick match: 3+2, 5+0, 10+0 · Custom games: common presets (see §3) |
| Agent harness | walkinglabs learn-harness-engineering templates (see §7) |

## 2. Makruk rules scope (engine must get these exactly right)

- Board 8×8, un-checkered. Start FEN (Fairy-Stockfish notation, verify):
  `rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1`
  — kings on d1 / e8 (not facing), Bia (pawns) start on 3rd / 6th rank.
- Pieces: **Khun** (king, 1 step any dir) · **Met** (1 step diagonal) · **Khon** (1 step diagonal or 1 straight forward) · **Ma** (knight) · **Ruea** (rook) · **Bia** (1 forward, captures diagonally forward, no double step).
- Promotion: Bia reaching opponent's 3rd rank (rank 6 for White) promotes to **Bia Ngai** (moves as Met). Mandatory.
- No castling, no en passant. Checkmate wins. Stalemate = draw.
- Counting rules (draw after N moves when chasing a bare/weak side):
  - **Sak Kradan** (board's honour): no Bia left → disadvantaged side may count to 64.
  - **Sak Mak** (pieces' honour): disadvantaged side has lone Khun → limit by attacker's material: 2 Ruea 8 · 1 Ruea 16 · 2 Khon 22 · 2 Ma 32 · 1 Khon 44 · otherwise 64; count starts at pieces-on-board + 1.
  - Exact edge cases to be cross-checked against Fairy-Stockfish's `makruk` implementation + a Thai federation source before engine is marked passing.
- Also: threefold repetition, resign, draw by agreement, flag on time (online).

## 3. Feature brainstorm

### Core game
- Tap-to-move + drag-to-move, legal-move dots, last-move highlight, check highlight
- Move list (SAN-like Makruk notation), step back/forward through history
- Undo (local & vs-AI only), flip board, resign, offer draw
- Counting-rule indicator (visible counter when Sak Kradan / Sak Mak active)
- Captured-pieces tray, material diff
- Game export/import (FEN + PGN-style), share position link
- Clocks with **game settings presets** (local pass-and-play, private rooms, vs AI optional):
  - Bullet: 1+0 · 2+1
  - Blitz: 3+0 · 3+2 · 5+0 · 5+3
  - Rapid: 10+0 · 10+5 · 15+10
  - Classical: 30+0 · 30+20
  - No clock · Custom (minutes + increment)
  - Quick match pool limited to 3+2 · 5+0 · 10+0
  - Last-used setting remembered; other settings per game: play as White/Black/random, rated/unrated (signed-in), undo allowed (local/AI only)

### Single player (vs computer)
- 6–8 difficulty levels ("Novice" → "Master") with named bot personas
- Hint button, takeback, post-game "best move" review (blunder highlights)
- Engine runs in a Web Worker → UI never freezes
- Engine options:
  - **A. Own TS alpha-beta engine** (MIT, ours) — easy/medium levels, small bundle
  - **B. Fairy-Stockfish WASM** (supports Makruk natively, very strong) — hard levels + analysis
  - ⚠️ Fairy-Stockfish is **GPL-3.0** → shipping it obliges publishing app source under GPL-compatible terms. Recommendation: start with A; add B only if repo will be public/GPL.

### Multiplayer
- **Pass-and-play (single device):** auto-rotate board or "tabletop" mode (opponent's pieces/UI mirrored), turn banner, optional clocks
- **Online private room:** create game → share link / 6-char code / QR → friend joins
- **Online quick match:** matchmaking queue by time control (+ rating band when signed in)
- Server-authoritative: every move validated by shared engine inside Durable Object
- Server clocks, reconnect with grace period, abandonment → loss, rematch
- **No chat** of any kind (no text, no emoji) — only game actions: offer draw, resign, rematch
- Spectate via link (later)

### Tutorials (beginner)
- Interactive lessons: board & setup → each piece (mini-puzzles per piece) → promotion → check/checkmate → counting rules → basic tactics
- "Guided first game" vs Novice bot with coach hints
- Puzzle set (mate-in-1/2), daily puzzle (later)
- Progress saved (local for guests, synced when signed in)
- Makruk vs Western chess cheat-sheet for chess players

### Design language
- **Learning & app shell = Duolingo-style:** bright friendly palette, chunky rounded buttons with bottom "press" shadow, bouncy micro-animations, a Makruk mascot character (in-house), lesson path map with unlockable nodes, XP, stars per lesson (a daily streak was built, then removed at the owner's request), celebratory end-of-lesson screens
- **Game screen = Chess.com-style:** clean focused board, player cards with clocks, move list panel, post-game review with best-move/blunder markers, compact controls
- **All art in-house:** SVG piece sets, mascot + poses, lesson illustrations, board textures. Plan a design-system step (tokens, components, illustration style guide) before bulk UI work

### Themes & visuals
- Board themes: Teak wood · Jade temple · Gold & lacquer · Night market neon · Minimal flat · High-contrast (a11y)
- Piece sets: Traditional carved Makruk style · Modern flat · Western-style glyphs (for chess players)
- Light/dark app UI, move animations, capture/check effects, sound packs, haptics on mobile
- 2D SVG at MVP; 3D board (react-three-fiber) is a stretch goal
- ⚠️ Custom art is in-house → ship a placeholder SVG set early (M2), replace with final art in M7; art must never block gameplay work

### Platform & account
- PWA install, offline play (local + AI + tutorials work offline)
- i18n: **Thai default**, English switchable (persisted setting; `<html lang>` updates). Thai piece names primary (ขุน, เม็ด, โคน, ม้า, เรือ, เบี้ย). Thai-capable font (e.g. Noto Sans Thai / IBM Plex Sans Thai). All UI strings via i18next keys from first UI commit.
- Guest ID (signed token in localStorage) → optional account (**username + password**, confirmed by email, password reset by email) merges guest history (emails via Resend)
- Profile: rating (Glicko-2), game history, stats, tutorial progress
- Settings: theme, piece set, sound, move confirmation, board coordinates, language

## 4. Architecture

```
th-chess.beanroti.com  (one Cloudflare Worker, same origin → no CORS)
 ├── /*        static assets (Vite build, PWA)          [Workers Static Assets]
 ├── /api/*    REST: auth, profile, history, matchmake  [Hono router]
 └── /ws/game/:id  WebSocket → GameRoom Durable Object  [hibernation API]

Durable Objects
 ├── GameRoom      one per game: state, clocks, move validation, reconnect
 └── Matchmaker    queue per time control, pairs players, creates GameRoom
D1 (SQLite): users, guests, games (moves, result), ratings, tutorial_progress
```

### Repo layout (npm workspaces)

```
t-chess/
├── apps/web/            React 19 + Vite + TS, Tailwind v4 + shadcn/ui, Zustand,
│                        TanStack Query, React Router, i18next, Motion, vite-plugin-pwa
├── apps/worker/         Cloudflare Worker (Hono) + Durable Objects + D1 migrations (wrangler)
├── packages/engine/     PURE TS Makruk rules: board, movegen, legality, counting, FEN, notation
├── packages/ai/         search (alpha-beta, iterative deepening, eval) — runs in Web Worker
├── packages/protocol/   Zod schemas for WS/REST messages shared by web + worker
├── docs/                PLAN.md, rules reference, ADRs
└── harness files        CLAUDE.md, AGENTS.md, init.sh, feature_list.json, claude-progress.md, …
```

Key principle: **engine is one pure package used by UI, AI, and server** → rules can never disagree between client and server.

### Testing
- Engine: Vitest unit tests + **perft** node counts cross-checked against Fairy-Stockfish; counting-rule scenario tests
- Web: Vitest + Testing Library; **Playwright** E2E (play a game, pass-and-play, tutorial step, two-browser online game)
- Worker: `@cloudflare/vitest-pool-workers` for Durable Object tests
- CI: GitHub Actions → lint, typecheck, test, build; deploy on `main` via `wrangler deploy`

## 5. Milestones

| # | Milestone | Outcome |
|---|---|---|
| M0 | Harness + scaffold | Repo, workspaces, harness files, CI, "hello" deployed to th-chess.beanroti.com |
| M1 | Rules engine | Legal movegen, check/mate/stalemate, promotion, counting rules, FEN; perft verified |
| M2 | Local play | Board UI, move list, undo, flip, pass-and-play, basic theme system, i18n (TH default / EN) |
| M3 | vs Computer | Web-Worker AI, difficulty levels, hints |
| M4 | Tutorials | Lesson engine + piece lessons + counting lesson + guided game |
| M5 | Online (guest) | Private room link/code, GameRoom DO, clocks, reconnect, resign/draw/rematch |
| M6 | Accounts & ranked | Optional sign-in, quick match, Glicko-2, history |
| M7 | Polish | Full themes & piece sets, sounds, PWA offline, translation review (native Thai), a11y, analytics |

MVP public launch = M0–M5 (+ minimal themes). M6–M7 follow.

## 6. Deployment plan (th-chess.beanroti.com)

1. `wrangler` login to the account owning `beanroti.com` (zone active, Free plan).
2. `wrangler.jsonc`: `routes: [{ pattern: "th-chess.beanroti.com", custom_domain: true }]` → Cloudflare auto-creates DNS record + TLS cert.
3. Bind D1 database + Durable Object classes (with migrations) in same config.
4. Environments: `preview` on `*.workers.dev`, `production` on the custom domain.
5. GitHub Actions deploy uses a scoped Cloudflare API token (Workers + D1 + DNS edit for beanroti.com only) stored as repo secret.

## 7. Harness engineering setup

Copied from walkinglabs templates and filled for this repo:

| File | Purpose here |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | Operating loop: read progress + feature list, run `./init.sh`, one feature at a time, evidence before `passing` |
| `init.sh` | `INSTALL_CMD=npm ci` · `VERIFY_CMD=npm run verify` (lint+typecheck+test) · `START_CMD=npm run dev` |
| `feature_list.json` | All features below as `not_started`, each with verification steps + evidence slot |
| `claude-progress.md` | Current verified state + per-session record |
| `session-handoff.md` | Compact handoff when session ends mid-feature |
| `clean-state-checklist.md` | End-of-session gate (tests green, no stray files, committed) |
| `evaluator-rubric.md` | Scores agent output per feature |
| `quality-document.md` | Codebase health scorecard per area (engine, web, worker, AI, tutorials) |

Draft feature ids (priority order): `infra-001` scaffold · `infra-002` CI · `infra-003` deploy hello · `engine-001` board+FEN · `engine-002` movegen · `engine-003` check/mate/stalemate · `engine-004` promotion · `engine-005` counting rules · `engine-006` perft verification · `design-001` design system (tokens, Duolingo-style components, illustration style guide) · `i18n-001` i18n setup (TH default, EN toggle) · `play-001` board render (placeholder SVG pieces) · `play-002` tap/drag moves · `play-003` move list & history · `play-004` pass-and-play · `play-005` game settings & time-control presets · `theme-001` theme system · `ai-001` worker search · `ai-002` difficulty levels · `ai-003` hints · `learn-001` lesson engine · `learn-002` piece lessons · `learn-003` counting lesson · `learn-004` guided game · `learn-005` lesson path map, XP & streaks · `online-001` GameRoom DO · `online-002` private room link · `online-003` clocks · `online-004` reconnect/resign/draw/rematch · `acct-001` guest identity · `acct-002` sign-in · `online-005` quick match · `acct-003` ratings & history · `theme-002` piece sets & board themes · `art-001` final in-house piece set · `art-002` mascot & lesson illustrations · `polish-001` PWA offline · `polish-002` Thai translation review · `polish-003` sounds & animations

## 8. Open questions

None blocking.

Resolved 2026-09-13: repo `socheek-del/Makruk` **public, licensed GPL-3.0** → Fairy-Stockfish WASM allowed for hard AI levels & analysis · Duolingo + Chess.com style, in-house art · ~~Google + email magic link~~ → username + password with email confirmation and reset (owner change, same day) · no chat · quick match 3+2/5+0/10+0 + custom presets · domain `th-chess.beanroti.com`.
