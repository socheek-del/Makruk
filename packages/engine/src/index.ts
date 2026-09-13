/**
 * Makruk rules engine. Pure TypeScript: no DOM, network, or timers.
 * Shared by the web app, the AI, and the online game server.
 */
export { parseSquare, squareName } from './board';
export { FenError, parseFen, serializeFen, START_FEN } from './fen';
export { Game, IllegalMoveError, moveToUci } from './game';
export { perft } from './perft';
export type { Color, CountingState, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';
