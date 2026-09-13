/**
 * Diagnostic (opt-in): plays games between two bot levels and records how each game ends, to tune
 * the strength ladder. Run: DIAG_STRONG=5 DIAG_WEAK=4 DIAG_GAMES=6 npx vitest run src/diagnose.test.ts
 */
import { appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game } from '@makruk/engine';
import { describe, it } from 'vitest';
import { chooseMove, evaluate, mulberry32, positionKey } from './index';
import * as core from '@makruk/engine/core';

const STRONG = Number(process.env.DIAG_STRONG ?? 0);
const WEAK = Number(process.env.DIAG_WEAK ?? 0);
const GAMES = Number(process.env.DIAG_GAMES ?? 6);
const MAX_PLIES = 400;

describe('diagnose bot games', () => {
  it.runIf(STRONG > 0 && WEAK > 0)(`L${STRONG} vs L${WEAK}`, { timeout: 6 * 3_600_000 }, () => {
    const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'diagnose-results.log');
    for (let g = 0; g < GAMES; g++) {
      const strongWhite = g % 2 === 0;
      const game = new Game();
      const rng = mulberry32(5_000 + g);
      let firstCountingPly = -1;
      const history = [positionKey(game.fen())];
      while (!game.isGameOver() && game.moves().length < MAX_PLIES) {
        const level = (game.turn === 'w') === strongWhite ? STRONG : WEAK;
        const move = chooseMove(game.fen(), level, { rng, ignoreTime: true, history });
        if (!move) break;
        history.push(positionKey(game.move(move.uci).fenAfter));
        if (firstCountingPly < 0 && game.counting()) firstCountingPly = game.moves().length;
      }
      const status = game.status();
      const pos = core.parseFen(game.fen());
      const strongColor = strongWhite ? 0 : 1;
      const materialForStrong = evaluate(pos.board, strongColor as core.ColorIndex);
      appendFileSync(
        out,
        `${new Date().toISOString()} L${STRONG}(${strongWhite ? 'w' : 'b'}) vs L${WEAK}: ${status.kind}` +
          `${status.kind === 'checkmate' ? ` winner=${status.winner}` : ''} plies=${game.moves().length}` +
          ` countingFrom=${firstCountingPly} evalForStrong=${materialForStrong} fen=${game.fen()}\n`,
      );
    }
  });
});
