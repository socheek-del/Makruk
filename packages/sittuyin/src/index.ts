/**
 * Sittuyin (Burmese chess) rules engine. Pure TypeScript: no DOM, network, or timers.
 * Rules follow Fairy-Stockfish's `sittuyin` variant.
 */
export { parseSquare, squareName } from '@makruk/engine/core';
export { FenError, parseFen, serializeFen, START_FEN } from './fen';
export { Game, IllegalMoveError, moveToUci } from './game';
export { perft } from './perft';
export type { Color, CountingState, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';
