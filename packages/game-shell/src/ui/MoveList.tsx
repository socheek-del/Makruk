import type { VariantMoveRecord } from '@chaturanga/rules-core';
import { cn } from '@chaturanga/ui';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface MoveListProps {
  records: ReadonlyArray<Pick<VariantMoveRecord, 'color' | 'san'>>;
  /** Ply currently shown on the board (0 = start). */
  currentPly: number;
  onSelect: (ply: number) => void;
}

export function MoveList({ records, currentPly, onSelect }: MoveListProps) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  // Keep the current move visible by scrolling the list itself — never the page.
  useEffect(() => {
    const list = listRef.current;
    const item = currentRef.current;
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + item.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + item.offsetHeight - list.clientHeight;
  }, [currentPly, records.length]);

  type Cell = Pick<VariantMoveRecord, 'color' | 'san'>;
  const offset = records[0]?.color === 'b' ? 1 : 0;
  const cells: Array<Cell | null> = [...Array<null>(offset).fill(null), ...records];
  const rows: Array<Array<Cell | null>> = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));

  return (
    <section aria-labelledby="move-list-heading" className="rounded-[1.25rem] border border-line bg-surface shadow-card">
      <h2 id="move-list-heading" className="border-b border-line px-4 py-2 font-semibold">
        {t('play.moves')}
      </h2>
      {records.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">{t('play.noMoves')}</p>
      ) : (
        <ol
          ref={listRef}
          data-testid="move-list"
          className="relative max-h-48 overflow-y-auto p-2 text-sm lg:max-h-[calc(100dvh-26rem)]"
        >
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
                      'rounded-lg px-2 py-1 text-left font-medium',
                      current ? 'bg-primary-soft text-primary' : 'hover:bg-surface-2',
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
