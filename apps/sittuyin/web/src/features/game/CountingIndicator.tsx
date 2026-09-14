import { Card, ProgressBar } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';

/** ASEAN counting: the side that must mate has a limited number of moves left (packages/sittuyin/RULES.md). */
export function CountingIndicator({ counting }: { counting: { limitPlies: number; plies: number } }) {
  const { t } = useTranslation();
  const limit = Math.ceil(counting.limitPlies / 2);
  const current = Math.min(Math.ceil(counting.plies / 2), limit);
  return (
    <Card tone="warning" data-testid="counting" className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-2 text-sm font-extrabold">
        <span>{t('play.counting.title')}</span>
        <span className="tabular-nums">
          {current}/{limit}
        </span>
      </div>
      <ProgressBar value={current / limit} tone="gold" label={t('play.counting.title')} />
    </Card>
  );
}
