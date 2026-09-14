import type { Variant } from '@chaturanga/rules-core';
import { START_FEN } from './fen';
import { Game } from './game';

/** Makruk as a rules-core Variant, so server, AI and UI code can hold it without knowing Makruk rules. */
export const makruk = {
  id: 'makruk',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: ['k', 'm', 's', 'n', 'r', 'p'],
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
