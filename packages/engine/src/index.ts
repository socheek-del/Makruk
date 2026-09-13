/**
 * Makruk rules engine. Pure TypeScript: no DOM, network, or timers.
 * Shared by the web app, the AI, and the online game server.
 */

/** Standard Makruk start position (Fairy-Stockfish `makruk` notation). */
export const START_FEN = 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1';

export type Color = 'w' | 'b';
