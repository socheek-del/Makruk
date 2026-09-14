# Sittuyin rules (as implemented)

`packages/sittuyin` follows **Fairy-Stockfish's `sittuyin` variant**, the way `packages/makruk` follows its
`makruk` variant. Every rule below was settled by probing ffish 0.7.10 (Fairy-Stockfish compiled to WASM).
Each probe is kept as a unit test: `src/setup.test.ts`, `src/movegen.test.ts`, `src/rules.test.ts`.
Lock-step random games (`src/reference.test.ts`) and a perft reference (`src/testing/perft-reference.json`)
check the whole engine against Fairy-Stockfish on every ply.

## Pieces

| Letter | Burmese | English | Moves like |
|---|---|---|---|
| K | Min-gyi (မင်းကြီး) | King | one step in any direction |
| F | Sit-ke (စစ်ကဲ) | General | one step diagonally (Makruk Met) |
| S | Sin (ဆင်) | Elephant | one step diagonally or straight forward (Makruk Khon) |
| N | Myin (မြင်း) | Horse | knight |
| R | Yahhta (ရထား) | Chariot | rook |
| P | Ne (နယ်) | Pawn | one step forward, captures one step diagonally forward, no double step |

The two Min-gyi may not stand next to each other, since that would put a king in check.

## Start and setup phase

- Start FEN: `8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KSSFRRNNkssfrrnn] w - - 0 1`. Only the Ne are on the board;
  the other 16 pieces are in hand.
- Players take turns, White first, placing one piece per ply. That is 16 plies (`K@h3`, `N@a1`).
- A piece goes on an empty square of the player's own three ranks: White ranks 1–3, Black ranks 6–8.
  A Yahhta may only go on the back rank.
- A side with a piece in hand must place it while any placement square is free. A side with an empty
  hand moves normally.
- A placement must not leave the player's own Min-gyi in check. It may give check.
- A placement resets the halfmove clock. The fullmove number advances as usual, so setup ends at move 9.
- FEN lists pieces in hand in brackets after the placement: White upper case, then Black, each in the order
  K S F R N.

## Promotion

A Ne becomes a Sit-ke through a separate move, written `h5g4f` (SAN `h5g4=F`) or in place `e5e5f` (`e5=F`).

- **Sit-ke already present:** a side may not promote while it has a Sit-ke on the board, promoted or not.
- **Promotion squares:** a Ne may promote only from its side's promotion squares, the long diagonals in the
  opponent's half:
  - White: a8 b7 c6 d5 e5 f6 g7 h8
  - Black: a1 b2 c3 d4 e4 f3 g2 h1

  A side's **last** Ne may promote from any square.
- **Target square:** the new Sit-ke stands on the Ne's own square or an **empty** diagonal neighbour, in any
  direction (backward too). It never captures.
- **No attack:** the new Sit-ke may not attack any enemy piece.
- **No check:** the promotion may not give check, not even a discovered one.
- **Other legality:** normal legality still applies. A promotion may block a check; a pinned Ne can only
  promote in place.
- A Ne that reaches the last rank without promoting stays there.

## End of the game

| Result | Rule |
|---|---|
| Win | Checkmate. |
| Draw | Stalemate. |
| Draw | Threefold repetition within the reversible-move window (same placement, hands and side to move). |
| Draw | 50-move rule: 100 plies without a capture, Ne move or placement. |
| Draw | Insufficient material, the same rule as Makruk. A Yahhta or Sin can mate; a Sit-ke is colour-bound; a Myin or Ne needs a helper piece. Pieces still in hand count as mating material. |
| Draw | Counting: the count passes its limit before the lone Min-gyi is mated (below). |

### Counting (ASEAN counting)

Sittuyin counting differs from Makruk:

- There is no board's-honour count.
- The count starts at 0, not at the number of pieces.
- Limits depend only on the strongest attacking piece type:

| Strong side has | Limit |
|---|---|
| a Yahhta | 16 moves (32 plies) |
| else a Sin | 44 moves (88 plies) |
| else a Myin | 64 moves (128 plies) |
| only a Sit-ke and/or Ne | no count |

When the count starts or changes:

- **Start:** it applies only when no Ne is left on the board and the side to move has a lone Min-gyi. It
  starts (at 0) on the first move after which that holds while no count is running.
  - If the lone side itself captured the last Ne, the count starts after the opponent's next move.
- **Restart:** a capture or promotion that leaves the side to move with a lone Min-gyi restarts the count at
  0 with the new limit.
- **Keep:** a capture by the lone Min-gyi keeps the running count and its limit.
- **Limit reached:** every ply is counted. The game is drawn once the counted plies exceed the limit; a mate
  on the limit ply still wins.
- **Separate from the 50-move rule:** the 50-move clock keeps running separately. While a count runs, the
  FEN shows the count instead of the halfmove clock.

FEN while counting: `<placement>[hand] <side> - <limit plies> <counted plies> <fullmove>`, e.g.
`4k3/8/8/8/8/8/R7/4K3[] b - 32 0 1`.
