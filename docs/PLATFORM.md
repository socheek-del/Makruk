# Chaturanga platform plan

Owner decisions, 2026-09-14:

- One monorepo for a family of traditional strategy games. It will be renamed from `Makruk` to **`chaturanga`**, after the common ancestor of Makruk, Sittuyin, Shogi and Xiangqi.
- Every game is a **separate product**: its own site, brand, PWA, languages, lessons, Worker and D1 database. Games never share one UI. The only link between them is a "more games" section and footer.
- Sites live on **subdomains** for now. Parent domains are temporary, so no code, image or doc hardcodes them. Each app reads its address from its own config, as Makruk does today with `apps/web/site.config.ts`.
- **Sittuyin (Burmese chess)** is the second game. Its languages are Burmese (default) and English. Makruk stays Thai (default) and English.
- Shogi, Xiangqi and others come later, after Sittuyin ships.

## The one rule

**Nothing game-specific lives at the repository root or in a shared package. Everything game-specific lives in its game's folder.**

A game's identity lives in its app:

- rules and piece names
- piece art, board art and theme tokens
- lessons
- locale content: `pieces`, `about`, `seo`
- the list of languages, the default language and fonts
- PWA manifest, site address, README, `AGENTS.md`
- Worker name and D1 database

Adding a game must never edit another game's files.

## Target layout

```
packages/
  rules-core/     Variant interface + shared 8x8 helpers (squares, leaper tables)
  makruk/         Makruk rules (today's packages/engine), implements Variant
  sittuyin/       Sittuyin rules, implements Variant
  ai-core/        alpha-beta search over Variant; each game supplies evaluation + bot configs
  protocol/       REST/WebSocket schemas with a `variant` field and generic move strings
  ui/             component primitives; colours/fonts come from the app's theme tokens
  board-ui/       grid board of any size, pieces in hand, piece-set registry
  game-shell/     game screen, clocks, move list, online session, AI client, sound,
                  lesson player, shared locale namespaces (en/th/my)
  server-kit/     GameRoom + Matchmaker Durable Objects, Glicko-2, room logic that takes a Variant
  family/         sibling game list (id, names in every language, icon); URLs from app config
apps/
  makruk/web      makruk/worker      Wat theme · th, en
  sittuyin/web    sittuyin/worker    own theme · my, en
```

The root README describes the family. Each game has its own README and translated README (`README.th.md`, `README.my.md`). The root `AGENTS.md` holds platform rules; `apps/<game>/AGENTS.md` holds game facts. `feature_list.json` features carry a `product` field (`platform`, `makruk`, `sittuyin`).

## Variant interface (sketch — settled in plat-002)

```ts
export interface Variant<P = unknown> {
  id: string;                                   // 'makruk', 'sittuyin'
  files: number; ranks: number;
  startFen: string;
  parseFen(fen: string): P;                     // throws FenError
  toFen(position: P): string;
  legalMoves(position: P): string[];            // UCI-style: 'e3e4', 'h5g4f', 'K@h3'
  play(position: P, move: string): P;           // throws IllegalMoveError
  status(position: P, history: readonly string[]): GameStatus;
  pieceAt(position: P, square: string): Piece | null;
  hand?(position: P, color: Color): Piece[];    // Sittuyin setup, Shogi drops
}
```

Moves stay strings end to end (protocol, worker, stores, URLs) so no layer except the rules package parses them.

## Languages per product

```ts
// apps/sittuyin/web/product.config.ts
export default { id: 'sittuyin', locales: ['my', 'en'], defaultLocale: 'my', fonts: ['Noto Sans Myanmar'] };
```

- `game-shell` ships shared namespaces (`nav`, `play`, `online`, `settings`, …) in every language any product uses (`en`, `th`, `my`).
- Each app loads only its declared locales, so Thai never ships to the Sittuyin site.
- Test rule: **every locale an app declares is complete** for shared and app namespaces. This replaces "th and en both required".
- Burmese text is Unicode only (no Zawgyi encoding), uses an OFL Myanmar font and gets taller line-height tokens.

## Order of work

Every step leaves Makruk green: `npm run verify`, `npm run e2e`, CI deploy.

1. **Sittuyin rules engine (M9: sit-001..003).** A new pure package checked against Fairy-Stockfish's `sittuyin` variant, the way Makruk was. Nothing else changes. A second real engine is what the shared interface gets designed from.
2. **Platform extraction (M10: plat-002..006).**
   - Variant interface.
   - Rename and restructure.
   - Per-app locale config.
   - Shared UI/game/server packages with a `variant` column in protocol and D1.
   - Family links.
3. **Sittuyin product (M11: sit-004..011).**
   - AI.
   - Design identity and web app with setup-phase UI.
   - Lessons.
   - Online play.
   - Deploy on its subdomain.
   - SEO and README.
   - Native Burmese review.

## Sittuyin rules reference (from Fairy-Stockfish `sittuyin`, probed with ffish 0.7.10)

- Start: `8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KFRRSSNNkfrrssnn] w - - 0 1`. Pawns are on the board; the other 16 pieces start in hand.
- **Setup phase:** 16 alternating plies, White first, dropping pieces behind one's own pawns (`K@h3`, `N@a1`).
  - White's drop squares are ranks 1–2 plus e3–h3.
  - Rooks may only be dropped on the back rank.
- Pieces:
  - K (Min-gyi) = king
  - F (Sit-ke) = one step diagonally
  - S (Sin) = one step diagonally or straight forward
  - N (Myin) = knight
  - R (Yahhta) = rook
  - P (Ne) = one step forward, captures diagonally forward
- **Promotion is a separate move** (`h5g4f` diagonal step, `e5e5f` in place). The pawn becomes a Sit-ke (F).
- **Game end:** differs from Makruk: 50-move rule, ASEAN counting with no board's honour, limits 32/88/128 plies by strongest piece. Full rules as implemented and verified: `docs/sittuyin-rules.md`.

## Open questions

- Sittuyin brand identity: its own design document with shared component primitives. Decided in sit-005.
- Subdomain names (e.g. one per game under the current parent domain). Chosen at deploy time in sit-009, never hardcoded.
