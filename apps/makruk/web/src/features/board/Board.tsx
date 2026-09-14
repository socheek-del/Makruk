import { Board as BoardView, type BoardProps as BoardViewProps } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/makruk';
import { useTranslation } from 'react-i18next';
import { PieceSvg } from './PieceSvg';

export { pieceCode } from '@chaturanga/board-ui';

export type BoardProps = Omit<BoardViewProps, 'renderPiece' | 'label' | 'describeSquare'>;

/** The Makruk board: the shared board UI with Makruk piece art and Thai/English square names. */
export function Board(props: BoardProps) {
  const { t } = useTranslation();
  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  return (
    <BoardView
      {...props}
      label={t('board.label')}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      describeSquare={(square, piece) =>
        piece
          ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) })
          : t('board.emptySquare', { square })
      }
    />
  );
}
