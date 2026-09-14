# Makruk rules as implemented

The engine (`packages/makruk`) follows Fairy-Stockfish's `makruk` variant exactly.
Every rule below is covered by unit tests and by lock-step random games compared
against Fairy-Stockfish (`ffish`) after every ply (`src/reference.test.ts`).

## Board and pieces

- 8×8 board. Start: `rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1`.
  White Khun on d1, White Met on e1; Black Khun on e8, Black Met on d8.

| Letter | Thai | Name | Movement |
|---|---|---|---|
| K | ขุน | Khun | One step in any direction |
| M | เม็ด | Met | One step diagonally |
| S | โคน | Khon | One step diagonally or one step straight forward |
| N | ม้า | Ma | Knight jump |
| R | เรือ | Ruea | Any distance along ranks and files |
| P | เบี้ย | Bia | One step forward (never two); captures one step diagonally forward |

- No castling, no en passant.
- **Promotion:** a Bia that reaches the opponent's third rank (rank 6 for White,
  rank 3 for Black), by moving or capturing, must become a Met (Bia Ngai).
  The FEN marks it as `M~` / `m~`; Fairy-Stockfish writes it as a plain `M`.

## Game end

Checked in this order by `Game.status()`:

1. **Checkmate** — side to move is in check with no legal move → the other side wins.
2. **Stalemate** — no legal move and not in check → draw.
3. **Threefold repetition** — the current position (placement + side to move)
   occurred twice before within the reversible-move window (plies since the last
   capture or Bia move) → draw.
4. **Counting limit reached** → draw (see below). Checkmate on the move that
   passes the limit still wins, because mate is detected first.
5. **Insufficient material** — neither side can mate (Fairy-Stockfish rule):
   - a side with a Ruea or Khon always has mating material;
   - a Met helps only if Mets stand on both square colours or any other non-Khun
     piece is on the board;
   - a Ma or Bia helps only if there are at least two non-Khun pieces in total.

There is no 50-move rule in Makruk.

## Counting rules (Sak Mak / Sak Kradan)

Counts are tracked in **plies** (half-moves), as in Fairy-Stockfish; the limit is
twice the number of moves. In FEN, while counting is active, field 4 holds the
limit and field 5 the plies counted so far, e.g. `4k3/8/8/8/8/8/R7/4K3 b - 32 6 1`.

Counting never applies while any unpromoted Bia is on the board, or when the
opponent of the counting side has only a Khun.

**Limit for a side** (in moves):

| Situation | Limit |
|---|---|
| Counting side still has more than its Khun — *board's honour* (Sak Kradan) | 64 |
| Lone Khun vs two Ruea — *pieces' honour* (Sak Mak) | 8 |
| Lone Khun vs one Ruea | 16 |
| Lone Khun vs two Khon (no Ruea) | 22 |
| Lone Khun vs two Ma (no Ruea/Khon) | 32 |
| Lone Khun vs one Khon (no Ruea) | 44 |
| Lone Khun vs anything else (e.g. Met, Ma) | 64 |

**When a count starts or restarts** (evaluated after every move, for the side now to move):

- If no count is running and the side to move has a non-zero limit, a count starts:
  - board's honour starts at 0 plies;
  - pieces' honour starts at 2 × (total pieces on the board) plies — i.e. the
    count begins at the number of pieces, per the Thai rule.
- If the side to move has a lone Khun and the move just played was a capture or a
  promotion, the pieces'-honour count restarts with the new limit and start value.
- If a lone Khun captures the last Bia, that side's count starts at
  2 × (total pieces) − 1 plies.

Each ply adds one to a running count. When the count exceeds the limit and the
side to move is not checkmated, the game is drawn.

**Known simplification (matches Fairy-Stockfish):** a single count is shared by the
game; when both sides qualify for board's honour, the side to move right after the
last Bia disappears is recorded as the counting side (shown in the UI counter).
