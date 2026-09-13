/**
 * Bot strength ladder (ai-002): each level must beat the level below in a majority of games.
 * Slow — run with `npm run test:strength -w packages/ai`. Set STRENGTH_PAIR=n to run only
 * level n+1 vs level n (lets pairs run in parallel processes), STRENGTH_GAMES to change the count.
 */
import { appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game } from '@makruk/engine';
import { describe, expect, it } from 'vitest';
import { BOTS, chooseMove, mulberry32 } from './index';

const GAMES = Number(process.env.STRENGTH_GAMES ?? 20);
const ONLY_PAIR = process.env.STRENGTH_PAIR ? Number(process.env.STRENGTH_PAIR) : null;
const MAX_PLIES = 400;

function playGame(whiteLevel: number, blackLevel: number, seed: number): 'w' | 'b' | 'draw' {
  const game = new Game();
  const rng = mulberry32(seed);
  while (!game.isGameOver() && game.moves().length < MAX_PLIES) {
    const move = chooseMove(game.fen(), game.turn === 'w' ? whiteLevel : blackLevel, { rng, ignoreTime: true });
    if (!move) break;
    game.move(move.uci);
  }
  const status = game.status();
  return status.kind === 'checkmate' ? status.winner : 'draw';
}

describe('bot strength ladder (ai-002)', () => {
  for (let i = 1; i < BOTS.length; i++) {
    const strong = BOTS[i]!;
    const weak = BOTS[i - 1]!;
    it.runIf(ONLY_PAIR === null || ONLY_PAIR === i)(
      `${strong.key} (L${strong.id}) beats ${weak.key} (L${weak.id}) in a majority of ${GAMES} games`,
      { timeout: 6 * 3_600_000 },
      () => {
        let wins = 0;
        let losses = 0;
        let draws = 0;
        for (let g = 0; g < GAMES; g++) {
          const strongIsWhite = g % 2 === 0;
          const result = playGame(strongIsWhite ? strong.id : weak.id, strongIsWhite ? weak.id : strong.id, 1_000 * i + g);
          if (result === 'draw') draws++;
          else if (result === (strongIsWhite ? 'w' : 'b')) wins++;
          else losses++;
        }
        const line = `${new Date().toISOString()} L${strong.id} ${strong.key} vs L${weak.id} ${weak.key}: +${wins} -${losses} =${draws} (${GAMES} games)\n`;
        // Vitest swallows console output from passing tests; keep a durable record for evidence.
        appendFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'strength-results.log'), line);
        expect(wins).toBeGreaterThan(GAMES / 2);
      },
    );
  }
});
