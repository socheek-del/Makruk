/**
 * Plays seeded random Sittuyin games, setup included, in lock-step with Fairy-Stockfish (ffish) and
 * compares legal moves, SAN, FEN (including counting fields) and game-over state after every ply
 * (sit-002, sit-003).
 */
import { describe, expect, it } from 'vitest';
import { Game, moveToUci } from './game';
import { type FfishBoard, loadFfish, mulberry32, normalizeFen } from './testing/ffish';

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 60;
const MAX_PLIES = 400;

function compare(game: Game, ref: FfishBoard, context: () => string): void {
  const ours = game.legalMoves().map(moveToUci).sort();
  expect(ours, `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(normalizeFen(game.fen()), `fen ${context()}`).toBe(ref.fen());
  expect(game.isGameOver(), `game over ${context()} status=${game.status().kind}`).toBe(ref.isGameOver(true));
}

describe('lock-step random games vs Fairy-Stockfish (sit-002, sit-003)', () => {
  it(`${GAMES} seeded games agree on every ply`, { timeout: 600_000 }, async () => {
    const ffish = await loadFfish();
    let promotions = 0;
    let countingPlies = 0;
    const endings: Record<string, number> = {};

    for (let seed = 1; seed <= GAMES; seed++) {
      const rand = mulberry32(seed);
      const game = new Game();
      const ref = new ffish.Board('sittuyin');
      const played: string[] = [];
      const context = () => `seed=${seed} moves=${played.join(' ')}`;
      try {
        compare(game, ref, context);
        while (!game.isGameOver() && played.length < MAX_PLIES) {
          const moves = game.legalMoves();
          const promoting = moves.filter((m) => m.kind === 'move' && m.promotion);
          const captures = moves.filter((m) => m.kind === 'move' && !m.promotion && game.pieceAt(m.to) !== null);
          // Prefer captures and promotions so games reach counting endgames.
          const pool =
            captures.length && rand() < 0.6 ? captures : promoting.length && rand() < 0.5 ? promoting : moves;
          const uci = moveToUci(pool[Math.floor(rand() * pool.length)]!);
          const san = ref.sanMove(uci);
          expect(game.move(uci).san, `san of ${uci} ${context()}`).toBe(san);
          ref.push(uci);
          played.push(uci);
          if (uci.endsWith('f')) promotions++;
          if (game.counting()) countingPlies++;
          compare(game, ref, context);
        }
        endings[game.status().kind] = (endings[game.status().kind] ?? 0) + 1;
      } finally {
        ref.delete();
      }
    }

    expect(promotions, JSON.stringify(endings)).toBeGreaterThan(0);
    expect(countingPlies, JSON.stringify(endings)).toBeGreaterThan(0);
    // Every draw kind that random games reach should be exercised, not only checkmates.
    expect(Object.keys(endings).length, JSON.stringify(endings)).toBeGreaterThan(2);
  });
});
