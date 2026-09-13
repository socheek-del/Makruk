import type { CountingState } from '@makruk/engine';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';

export function CountingIndicator({ counting }: { counting: CountingState }) {
  const { t } = useTranslation();
  const limit = counting.limitPlies / 2;
  const current = Math.min(Math.ceil(counting.plies / 2), limit);
  return (
    <Card tone="warning" data-testid="counting" className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-2 text-sm font-extrabold">
        <span>
          {t(`play.counting.${counting.kind}`)} · {t('play.counting.side', { color: t(`colors.${counting.side}`) })}
        </span>
        <span className="tabular-nums">
          {current}/{limit}
        </span>
      </div>
      <ProgressBar value={current / limit} tone="gold" label={t(`play.counting.${counting.kind}`)} />
    </Card>
  );
}
