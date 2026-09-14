import { inSetupPhase } from '@chaturanga/game-shell';
import type { Color, Game } from '@chaturanga/sittuyin';
import { chooseMove } from '@chaturanga/sittuyin-ai';

/** The strongest persona, so Auto-arrange gives a sound traditional arrangement rather than a noisy one. */
const ARRANGER_LEVEL = 6;

/**
 * Fills in the rest of the setup for the sides the caller is allowed to place for.
 *
 * Sittuyin's setup alternates, so a side cannot finish its own arrangement on its own: pass-and-play
 * arranges both sides, while against the computer the human arranges only their own and the bot answers
 * as usual. Placement is a cheap heuristic (no search), so this runs on the main thread.
 */
export function autoArrange(game: Game, play: (uci: string) => unknown, canPlaceFor: (color: Color) => boolean): number {
  let placed = 0;
  // 16 placements in a full setup; the bound also stops a bad engine state from looping forever.
  for (let i = 0; i < 16 && inSetupPhase(game) && canPlaceFor(game.turn); i++) {
    const move = chooseMove(game.fen(), ARRANGER_LEVEL);
    if (!move) break;
    play(move.uci);
    placed++;
  }
  return placed;
}
