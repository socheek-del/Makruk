import { Board as BoardView, type BoardProps as BoardViewProps } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/sittuyin';
import { useTranslation } from 'react-i18next';
import { PieceSvg } from './PieceSvg';
import { PromotionDiagonals } from './PromotionDiagonals';
import type { BoardTheme } from './themes';

export { pieceCode } from '@chaturanga/board-ui';

export type BoardProps = Omit<BoardViewProps, 'renderPiece' | 'label' | 'describeSquare' | 'overlay' | 'theme'> & {
  theme: BoardTheme;
};

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
