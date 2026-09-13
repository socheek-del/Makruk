import type { MoveRecord } from '@makruk/engine';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export interface MoveListProps {
  records: readonly MoveRecord[];
  /** Ply currently shown on the board (0 = start). */
  currentPly: number;
  onSelect: (ply: number) => void;
}

export function MoveList({ records, currentPly, onSelect }: MoveListProps) {
  const { t } = useTranslation();
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentPly, records.length]);

  const offset = records[0]?.color === 'b' ? 1 : 0;
  const cells: Array<MoveRecord | null> = [...Array<null>(offset).fill(null), ...records];
  const rows: Array<Array<MoveRecord | null>> = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));

  return (
    <section aria-labelledby="move-list-heading" className="rounded-2xl border-2 border-line bg-surface">
      <h2 id="move-list-heading" className="border-b-2 border-line px-4 py-2 font-extrabold">
        {t('play.moves')}
      </h2>
      {records.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">{t('play.noMoves')}</p>
      ) : (
        <ol data-testid="move-list" className="max-h-48 overflow-y-auto p-2 text-sm lg:max-h-[calc(100dvh-26rem)]">
          {rows.map((row, r) => (
            <li key={r} className="grid grid-cols-[2.25rem_1fr_1fr] items-center gap-1">
              <span className="pl-1 text-muted">{r + 1}.</span>
              {row.map((record, c) => {
                if (!record) return <span key={c} />;
                const ply = r * 2 + c - offset + 1;
                const current = ply === currentPly;
                return (
                  <button
                    key={c}
                    ref={current ? currentRef : undefined}
                    type="button"
                    data-ply={ply}
                    aria-current={current || undefined}
                    onClick={() => onSelect(ply)}
                    className={cn(
                      'rounded-lg px-2 py-1 text-left font-bold',
                      current ? 'bg-secondary-soft text-secondary' : 'hover:bg-surface-2',
                    )}
                  >
                    {record.san}
                  </button>
                );
              })}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
