import { LessonPlayer as Player, type LessonMood } from '@chaturanga/game-shell/ui';
import { makruk, type Piece } from '@chaturanga/makruk';
import { useTranslation } from 'react-i18next';
import { boardTheme } from '../board/themes';
import { PieceSvg } from '../board/PieceSvg';
import { useSettings } from '../../stores/settings';
import { playSound } from '../sound/sound';
import { Mascot, type MascotPose } from './Mascot';
import { type CountingExample, type Lesson, useL10n } from './types';

/** art-002: "ขุนน้อย" reacts to the learner. */
const POSE: Record<LessonMood, MascotPose> = {
  explaining: 'idle',
  thinking: 'thinking',
  correct: 'happy',
  wrong: 'sad',
  complete: 'celebrate',
};

export interface LessonPlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onFinish: (stars: 1 | 2 | 3) => void;
}

/** The Makruk lesson player: the shared player with the classic pieces, the board theme and the mascot. */
export function LessonPlayer(props: LessonPlayerProps) {
  const { t } = useTranslation();
  const translate = useL10n();
  const theme = boardTheme(useSettings((s) => s.boardTheme));

  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  return (
    <Player<ReturnType<typeof makruk.createGame>, CountingExample>
      {...props}
      variant={makruk}
      translate={translate}
      theme={theme}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      renderMascot={(mood, className) => <Mascot pose={POSE[mood]} className={className} />}
      onSound={(sound) => playSound(sound === 'complete' ? 'gameEnd' : sound)}
    />
  );
}
