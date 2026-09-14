import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelAi } from '../features/ai/aiClient';
import { findLesson } from '../features/learn/lessons';
import { useGuidedSession } from '../stores/localSession';
import { useProgress } from '../stores/progress';
import { ComputerGame } from './ComputerGamePage';

/** learn-004: first real game against the easiest bot, with coach tips. Finishing it completes the lesson. */
export function GuidedGamePage() {
  const { t } = useTranslation();
  const phase = useGuidedSession((s) => s.phase);
  const result = useGuidedSession((s) => s.result);
  const completeLesson = useProgress((s) => s.completeLesson);
  const recorded = useRef(false);

  useEffect(() => {
    if (phase === 'setup') useGuidedSession.getState().start(null);
  }, [phase]);

  useEffect(() => () => cancelAi(), []);

  useEffect(() => {
    if (!result) {
      recorded.current = false;
      return;
    }
    if (recorded.current) return;
    recorded.current = true;
    const lesson = findLesson('guided')!;
    completeLesson(lesson.id, result.winner === 'w' ? 3 : result.winner === null ? 2 : 1, lesson.xp);
  }, [result, completeLesson]);

  if (phase === 'setup') return null;
  return <ComputerGame useSession={useGuidedSession} level={1} humanColor="w" coach title={t('coach.gameTitle')} />;
}
