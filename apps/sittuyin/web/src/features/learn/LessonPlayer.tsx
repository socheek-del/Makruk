import { LessonPlayer as Player } from '@chaturanga/game-shell/ui';
import { type Piece, sittuyin } from '@chaturanga/sittuyin';
import { useTranslation } from 'react-i18next';
import { PieceSvg } from '../board/PieceSvg';
import { PromotionDiagonals } from '../board/PromotionDiagonals';
import { boardTheme } from '../board/themes';
import { useSettings } from '../../stores/settings';
import { type CountingExample, type Lesson, useL10n } from './types';

export interface LessonPlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onFinish: (stars: 1 | 2 | 3) => void;
}

/**
 * The Sittuyin lesson player: the shared player with yun pieces, the lacquer board and the promotion
 * diagonals. The diagonals are drawn here too, because the promotion lesson is about them.
 */
export function LessonPlayer(props: LessonPlayerProps) {
  const { t } = useTranslation();
  const translate = useL10n();
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const showCoordinates = useSettings((s) => s.showCoordinates);

  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  return (
    <Player<ReturnType<typeof sittuyin.createGame>, CountingExample>
      {...props}
      variant={sittuyin}
      translate={translate}
      theme={theme}
      showCoordinates={showCoordinates}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      boardOverlay={<PromotionDiagonals colour={theme.diagonal} />}
      handLabel={(color) => t('setup.hand', { color: t(`colors.${color}`) })}
      describeHandPiece={(type, count) => t('setup.handPiece', { piece: t(`pieces.${type}`), count })}
    />
  );
}
