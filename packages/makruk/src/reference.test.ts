/**
 * Plays seeded random games in lock-step with Fairy-Stockfish (ffish) and compares
 * legal moves, FEN (including counting fields) and game-over state after every ply.
 */
import { describe, expect, it } from 'vitest';
import { Game, moveToUci } from './game';
import { type FfishBoard, loadFfish, normalizeFen } from './testing/ffish';

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 60;
const MAX_PLIES = 300;

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function compare(game: Game, ref: FfishBoard, context: () => string): void {
  const ours = game.legalMoves().map(moveToUci).sort();
  const theirs = ref.legalMoves().split(' ').filter(Boolean).sort();
  expect(ours, `legal moves ${context()}`).toEqual(theirs);
  expect(normalizeFen(game.fen()), `fen ${context()}`).toBe(ref.fen());
  expect(game.isGameOver(), `game over ${context()} status=${game.status().kind}`).toBe(ref.isGameOver(true));
}

describe('lock-step random games vs Fairy-Stockfish (engine-005, engine-006)', () => {
  it(`${GAMES} seeded games agree on every ply`, { timeout: 600_000 }, async () => {
    const ffish = await loadFfish();
    let plies = 0;
    let countingPlies = 0;
    const endings: Record<string, number> = {};

    for (let seed = 1; seed <= GAMES; seed++) {
      const rand = mulberry32(seed);
      const game = new Game();
      const ref = new ffish.Board('makruk');
      const played: string[] = [];
      const context = () => `seed=${seed} moves=${played.join(' ')}`;
      try {
        compare(game, ref, context);
        while (!game.isGameOver() && played.length < MAX_PLIES) {
          const moves = game.legalMoves();
          const captures = moves.filter((m) => game.pieceAt(m.to) !== null);
          // Prefer captures so games reach counting endgames.
          const pool = captures.length && rand() < 0.6 ? captures : moves;
          const uci = moveToUci(pool[Math.floor(rand() * pool.length)]!);
          game.move(uci);
          ref.push(uci);
          played.push(uci);
          plies++;
          if (game.counting()) countingPlies++;
          compare(game, ref, context);
        }
        endings[game.status().kind] = (endings[game.status().kind] ?? 0) + 1;
      } finally {
        ref.delete();
      }
    }

    console.log(`reference games: ${GAMES}, plies compared: ${plies}, plies under counting: ${countingPlies}`, endings);
    expect(countingPlies).toBeGreaterThan(0);
  });
});
