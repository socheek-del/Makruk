# Sittuyin (စစ်တုရင်) — implementation plan

Second product of the Chaturanga family (`docs/PLATFORM.md`): Burmese chess as its own PWA site, Burmese by
default with English, sharing engineering but not identity with Makruk. Rules as implemented:
`packages/sittuyin/RULES.md` (verified against Fairy-Stockfish). Features: `sit-004`..`sit-011` plus the
platform steps they depend on (`plat-004`..`plat-006`) in `feature_list.json`.

## Product decisions (defaults; the owner can change any of them)

| Topic | Decision |
|---|---|
| Rules | Fairy-Stockfish `sittuyin`: alternating 16-ply setup, promotion as its own move, ASEAN counting, 50-move rule. |
| Languages | `my` (Burmese, default, Unicode only — no Zawgyi) and `en`. Every string in both; native Burmese review is sit-011. |
| Font | Noto Sans Myanmar (SIL OFL, `@fontsource`) with a Latin companion; taller line-height token for Burmese. |
| Setup UX | Hand tray per side; tap or drag a piece from the tray onto a highlighted square; **Auto-arrange** fills the remaining pieces with the bot placement policy; undo works during setup. |
| Clocks | Do not run during setup. They start after the 16th placement (local, computer and online). An online placement still has the reconnect/abandon grace period. |
| Promotion UX | Diagonal promotion targets are always empty squares, so they never clash with pushes or captures: they get a Sit-ke badge marker. In-place promotion is a **Promote** chip on the selected Ne. |
| Bots | Six personas after the pieces: Ne, Sit-ke, Sin, Myin, Yahhta, Min-gyi (`@chaturanga/sittuyin-ai`). |
| Look | Own design identity (sit-005), clearly different from Makruk's "Wat" and from Duolingo. Direction needs owner approval before the app is styled. |
| Hosting | Own Worker `sittuyin` + D1 `sittuyin` on its own subdomain (name chosen at sit-009; never hardcoded). |
| Storage | Browser keys prefixed `sittuyin.` so both sites can share an origin in development without clashing. |

## Architecture

```
packages/sittuyin        rules (done)             packages/sittuyin-ai    bots: ai-core search + eval + setup policy
packages/ai-core         shared search (new)      packages/rules-core     Variant interface (done)
packages/board-ui        generic Board, HandTray, move input for drops and in-place promotion   (plat-005a)
packages/game-shell      sessions, GameScreen, result, AI client, settings/progress/i18n/seo factories, lesson player (plat-005b)
packages/server-kit      room logic on a Variant, GameRoom, Matchmaker, auth (plat-005c)
apps/sittuyin/web        product.config (my/en, font, storage prefix), theme, piece art, lessons, locale content, manifest
apps/sittuyin/worker     wrangler.jsonc (worker + D1 sittuyin), thin entry around server-kit
```

Shared code is extracted **when the second consumer arrives**, one slice at a time, migrating Makruk in the
same step with its full E2E suite as the guard. Nothing Makruk-specific moves into a shared package.

## Seams found in the Makruk app (inventory 2026-09-14)

1. **Move input** — `useMoveInput` picks the first legal move matching from/to; `Board` drags only from
   squares and ignores `to === from`; `lastMove`/`animate` require `from`. Needed: Move union (drop | move),
   hand selection and drag source, in-place promotion, optional `from`.
2. **Hints and lessons** — `ComputerGamePage` and `LessonPlayer` slice UCI strings (`slice(0,4)`); compare
   full move strings instead.
3. **Game end** — `result.ts`, `undoAllowed`, protocol `ResultReason` and locales lack `fifty-move`;
   `CountingIndicator` needs `kind`/`side` that Sittuyin's count does not have.
4. **Setup phase** — `GameScreen` has no notion of `inSetup()`; clocks start at game start
   (`localSession.start`, worker `startIfReady`).
5. **Identity leaks** — `makruk.*` storage keys (settings, progress, identity, sessions, index.html pre-paint
   script), `__makrukSoundLog`, `Language = 'th' | 'en'`, `L10n {th, en}`, Prompt font, `x-makruk-user`
   header, `HealthResponse.service = 'makruk'`, email brand.
6. **Protocol** — move regex `^[a-h][1-8][a-h][1-8]m?$` rejects `K@h3`, `h5g4f`, `e5e5f`; the engine should be
   the only validator.

## Work breakdown (in order)

Each step ends with its feature's verification recorded; Makruk `verify` + full E2E stay green throughout.

### Step 1 — Computer opponent (`sit-004`, in progress)
- `@chaturanga/ai-core`: the Makruk search ported behind a `SearchAdapter` (make/unmake, legal moves,
  evaluation, tactical moves, ordering, repetition key) plus bot personas and noisy root-move picking. Tested
  on a toy game. Makruk's `packages/ai` keeps its own copy until it is migrated with a ladder re-run.
- `@chaturanga/sittuyin-ai`: adapter over the Sittuyin engine (drops, in-place promotion, hands in the key),
  evaluation (material incl. hands, Ne advancement and promotion readiness, mop-up + trade-down for counting),
  setup placement policy (traditional arrangement heuristics + persona noise), six bots, `chooseMove`/`bestMove`.
- Strength ladder: `src/strength.test.ts` (each game: bot setups, then a seeded 4-ply random opening, then
  bots), and `strength.yml` gains a `package` input so the same workflow runs either game.
- **Done when:** unit tests (mate in one, hanging piece, promotion, legal setups, sheltered Min-gyi, counting
  mate) pass and every level beats the one below in a majority of 20 games on GitHub Actions.

### Step 2 — Per-product languages (`plat-004`)
- `product.config.ts` per app: `id`, `locales`, `defaultLocale`, `fonts`, `storagePrefix`, `ogLocale`.
- Generic `Language` / `L10n` types (map of declared locales), i18n and SEO factories, pre-paint script reading
  the product's settings key; locale test checks every declared locale.
- Makruk adopts it unchanged in behaviour (`th` default, `en`).

### Step 3 — Board and move input (`plat-005a`)
- `@chaturanga/board-ui`: `Board` with `files`/`ranks`, `renderPiece` prop, optional `lastMove.from`,
  in-place target marker, promotion badge; `HandTray`; `useMoveInput` on `legalUci()` + Move union
  (square or hand selection, candidate list, in-place promotion).
- Makruk migrates; unit tests cover drops and in-place promotion with the Sittuyin engine.

### Step 4 — Game shell (`plat-005b`)
- `@chaturanga/game-shell`: `createGameSession(variant, { storagePrefix })` with setup-aware clocks,
  `createOnlineSession(variant)`, `GameScreen` with setup banner and hand trays, `MoveList`, `PlayerBar`,
  `GameOverModal` (incl. `fifty-move`), counting indicator without `kind`, AI client with injected worker,
  settings/progress stores, generic pages (local, computer, settings, learn path, lesson page).
- Makruk migrates; full E2E green.

### Step 5 — Design identity (`sit-005`, owner approval gate)
- `apps/sittuyin/docs/design.md`: palette, Myanmar typography, board look, in-house piece art
  (Min-gyi, Sit-ke, Sin, Myin, Yahhta, Ne; readable at 40px) and a mascot.
- A visual proposal for the owner before any styling lands; showcase page screenshots light/dark at 390/1280px.

### Step 6 — Sittuyin web app (`sit-006`)
- `apps/sittuyin/web`: product config, theme tokens, piece set, locales (`my`, `en`), pages Home, Play (pass-and-play,
  computer), Settings, About; setup phase with hand trays and Auto-arrange; promotion UI; counting indicator;
  refresh restore; PWA manifest (`lang: my`), offline.
- E2E: setup by tap and drag (illegal squares refused, Yahhta back rank only), Auto-arrange, a promotion in
  place, computer replies, refresh restores, `<html lang="my">` default and English persists, PWA offline.

### Step 7 — Lessons (`sit-007`)
- Units: the board and setup (placement rules, Auto-arrange), each piece, promotion (squares, last Ne,
  no-check rule), check and checkmate, counting and the 50-move rule, guided first game with coach tips.
- Every lesson validated by the engine (legal solutions, my + en text); E2E completes one lesson per language.

### Step 8 — Online play (`plat-005c` + `sit-008`)
- Protocol: engine-validated move strings, `fifty-move` reason, `service: string`, neutral user header.
- `@chaturanga/server-kit`: room logic on a Variant, clocks start after setup, GameRoom, Matchmaker, auth;
  Makruk worker migrates (workerd tests + online E2E green).
- `apps/sittuyin/worker`: wrangler config (Worker + D1 `sittuyin`), workerd tests for setup drops and illegal
  drops; two-browser E2E: create room, join by code, complete setup, play moves, boards match. No chat.

### Step 9 — Deploy (`sit-009`)
- Owner confirms the subdomain; Cloudflare D1 created; CI builds both products and deploys each one only
  when its paths or shared packages change; production smoke in Burmese.

### Step 10 — Growth and polish (`plat-006`, `sit-010`, `sit-011`)
- "More games" links between Makruk and Sittuyin (URLs from each app's config).
- SEO (my/en titles, hreflang, OG image, JSON-LD, sitemap), About page, `apps/sittuyin/README.md` +
  `README.my.md` with media captured from production.
- Native Burmese review recorded in `apps/sittuyin/docs/i18n-review.md` (needs a human reviewer).

## Burmese terminology (to confirm in sit-011)

| Piece | Burmese | Letter |
|---|---|---|
| King | မင်းကြီး (Min-gyi) | K |
| General | စစ်ကဲ (Sit-ke) | F |
| Elephant | ဆင် (Sin) | S |
| Horse | မြင်း (Myin) | N |
| Chariot | ရထား (Yahhta) | R |
| Pawn | နယ် (Ne) | P |
| Sittuyin | စစ်တုရင် | — |

## Risks

- **Translation quality** — Burmese strings are drafted by the team and flagged until a native review (sit-011).
- **Bot strength vs counting** — Yahhta endgames allow only 16 moves; the ladder and a counting-mate unit test guard it.
- **Extraction regressions in Makruk** — each extraction slice migrates Makruk with its full E2E suite in the same step.
- **CI time** — two products double E2E time; E2E runs per product and deploys are path-filtered.
