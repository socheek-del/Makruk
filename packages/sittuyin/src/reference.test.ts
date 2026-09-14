/**
 * Plays seeded random Sittuyin games, setup included, in lock-step with Fairy-Stockfish (ffish) and
 * compares legal moves, SAN, and the placement, hand and side to move after every ply (sit-002).
 * Counting fields and game end are compared once those rules land (sit-003).
 */
import { describe, expect, it } from 'vitest';
import { Game, moveToUci } from './game';
import { type FfishBoard, loadFfish, mulberry32, normalizeFen } from './testing/ffish';

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 60;
const MAX_PLIES = 300;

/** Placement with hand, and side to move. */
const positionOf = (fen: string) => normalizeFen(fen).split(' ').slice(0, 2).join(' ');

function compare(game: Game, ref: FfishBoard, context: () => string): void {
  const ours = game.legalMoves().map(moveToUci).sort();
  expect(ours, `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(positionOf(game.fen()), `position ${context()}`).toBe(positionOf(ref.fen()));
}

describe('lock-step random games vs Fairy-Stockfish (sit-002)', () => {
  it(`${GAMES} seeded games agree on every ply`, { timeout: 600_000 }, async () => {
    const ffish = await loadFfish();
    let plies = 0;
    let promotions = 0;

    for (let seed = 1; seed <= GAMES; seed++) {
      const rand = mulberry32(seed);
      const game = new Game();
      const ref = new ffish.Board('sittuyin');
      const played: string[] = [];
      const context = () => `seed=${seed} moves=${played.join(' ')}`;
      try {
        compare(game, ref, context);
        while (!ref.isGameOver(true) && played.length < MAX_PLIES) {
          const moves = game.legalMoves();
          const promoting = moves.filter((m) => m.kind === 'move' && m.promotion);
          const captures = moves.filter((m) => m.kind === 'move' && !m.promotion && game.pieceAt(m.to) !== null);
          // Prefer promotions and captures so games reach endgames where Ne promote.
          const pool =
            promoting.length && rand() < 0.5 ? promoting : captures.length && rand() < 0.5 ? captures : moves;
          const uci = moveToUci(pool[Math.floor(rand() * pool.length)]!);
          const san = ref.sanMove(uci);
          expect(game.move(uci).san, `san of ${uci} ${context()}`).toBe(san);
          ref.push(uci);
          played.push(uci);
          plies++;
          if (uci.endsWith('f')) promotions++;
          compare(game, ref, context);
        }
      } finally {
        ref.delete();
      }
    }

    console.log(`reference games: ${GAMES}, plies compared: ${plies}, promotions: ${promotions}`);
    expect(promotions).toBeGreaterThan(0);
  });
});
