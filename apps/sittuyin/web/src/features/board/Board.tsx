import { Board as BoardView, type BoardProps as BoardViewProps } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/sittuyin';
import { useTranslation } from 'react-i18next';
import { PieceSvg } from './PieceSvg';
import type { BoardTheme } from './themes';

export { pieceCode } from '@chaturanga/board-ui';

export type BoardProps = Omit<BoardViewProps, 'renderPiece' | 'label' | 'describeSquare' | 'overlay' | 'theme'> & {
  theme: BoardTheme;
};

/**
 * The two long diagonals a Ne promotes on. They are rules made visible, not decoration, so they are part
 * of the board rather than a theme flourish (apps/sittuyin/docs/design.md).
 */
function PromotionDiagonals({ colour }: { colour: string }) {
  return (
    <svg viewBox="0 0 8 8" preserveAspectRatio="none" className="h-full w-full" data-diagonals>
      <g stroke={colour} strokeWidth="0.05" strokeLinecap="round">
        <line x1="0" y1="0" x2="8" y2="8" />
        <line x1="8" y1="0" x2="0" y2="8" />
      </g>
    </svg>
  );
}

/** The Sittuyin board: the shared board UI with yun piece art, Burmese square names and the diagonals. */
export function Board({ theme, ...props }: BoardProps) {
  const { t } = useTranslation();
  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  return (
    <BoardView
      {...props}
      theme={theme}
      label={t('board.label')}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      overlay={<PromotionDiagonals colour={theme.diagonal} />}
    />
  );
}
