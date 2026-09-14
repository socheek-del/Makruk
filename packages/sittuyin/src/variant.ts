import type { Variant } from '@chaturanga/rules-core';
import { START_FEN } from './fen';
import { Game } from './game';

/** Sittuyin as a rules-core Variant, so server, AI and UI code can hold it without knowing Sittuyin rules. */
export const sittuyin = {
  id: 'sittuyin',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: ['k', 'f', 's', 'n', 'r', 'p'],
  hasHands: true,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
