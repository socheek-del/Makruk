/**
 * Low-level, allocation-light API for search code (packages/ai).
 * UI code should use the `Game` class from the package root instead.
 */
export * from './board';
export { type PositionData, parseFen, placementOf, serializeFen } from './fen';
export {
  encodeMove,
  findKing,
  generateLegalMoves,
  generatePseudoMoves,
  inCheck,
  isAttacked,
  isLegal,
  isPromotion,
  makeRaw,
  moveFrom,
  moveTo,
  PROMOTION_FLAG,
  unmakeRaw,
} from './movegen';
