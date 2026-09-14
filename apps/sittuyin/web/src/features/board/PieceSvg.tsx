import type { Piece } from '@chaturanga/sittuyin';
import { YunPiece } from './pieces/yun';

export const PIECE_SETS = {
  yun: YunPiece,
} as const;

export type PieceSetId = keyof typeof PIECE_SETS;
export const PIECE_SET_IDS = Object.keys(PIECE_SETS) as PieceSetId[];

export interface PieceSvgProps {
  piece: Piece;
  className?: string;
  set?: PieceSetId;
}

export function PieceSvg({ piece, className, set = 'yun' }: PieceSvgProps) {
  const Component = PIECE_SETS[set] ?? YunPiece;
  return <Component piece={piece} className={className} />;
}
