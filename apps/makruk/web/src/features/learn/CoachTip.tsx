import type { Color, Game } from '@chaturanga/makruk';
import { useTranslation } from 'react-i18next';
import { Card } from '@chaturanga/ui';
import { Mascot } from './Mascot';

const GENERAL_TIPS = ['develop', 'safeKhun', 'useHint'] as const;

/**
 * Picks the most relevant beginner tip for the current position.
 * `over` must include session-level endings (resignation, time) that the engine does not know about.
 */
export function coachTip(game: Game, humanColor: Color, over: boolean = game.isGameOver()): string {
  const records = game.moves();
  const last = records.at(-1);
  if (over) return 'gameOver';
  if (game.turn !== humanColor) return 'waiting';
  if (!records.some((r) => r.color === humanColor)) return 'firstMove';
  if (game.inCheck()) return 'inCheck';
  if (last && last.color !== humanColor && last.captured) return 'lostPiece';
  const legal = game.legalMoves();
  if (legal.some((m) => m.promotion)) return 'promote';
  if (legal.some((m) => game.pieceAt(m.to) !== null)) return 'capture';
  return GENERAL_TIPS[records.length % GENERAL_TIPS.length]!;
}

export function CoachTip({ game, humanColor, over }: { game: Game; humanColor: Color; over: boolean }) {
  const { t } = useTranslation();
  const tip = coachTip(game, humanColor, over);
  return (
    <Card tone="secondary" data-testid="coach-tip" data-tip={tip} className="flex items-start gap-3" aria-live="polite">
      <Mascot
        pose={tip === 'gameOver' ? 'celebrate' : tip === 'lostPiece' || tip === 'inCheck' ? 'sad' : tip === 'waiting' ? 'thinking' : 'idle'}
        className="h-14 w-14 shrink-0"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-secondary">{t('coach.title')}</span>
        <span className="font-bold">{t(`coach.${tip}`)}</span>
      </span>
    </Card>
  );
}
