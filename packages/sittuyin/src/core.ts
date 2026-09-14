/**
 * Low-level, allocation-light API for search code (packages/sittuyin-ai).
 * UI code should use the `Game` class from the package root instead.
 */
export * from './board';
export { handsOf, parseFen, placementOf, type PositionData, serializeFen } from './fen';
export { encodedToUci } from './game';
export {
  dropType,
  encodeDrop,
  encodeMove,
  generateDrops,
  generateLegalMoves,
  generatePieceMoves,
  isDrop,
  isLegal,
  isPromotion,
  makeRaw,
  moveFrom,
  moveTo,
  type Position,
  PROMOTION_FLAG,
  PROMOTION_SQUARES,
  unmakeRaw,
} from './movegen';
