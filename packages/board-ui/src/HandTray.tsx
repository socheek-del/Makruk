import type { Color, Piece, Square } from '@chaturanga/rules-core';
import { type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, useState } from 'react';
import type { BoardHandle } from './Board';
import type { BoardTheme } from './theme';

export interface HandTrayProps {
  color: Color;
  /** Piece types in hand, repeated per piece (e.g. ['k', 's', 's']). */
  pieces: readonly string[];
  theme: BoardTheme;
  renderPiece: (piece: Piece, className: string) => ReactNode;
  /** Accessible name of the tray. */
  label: string;
  /** Accessible name of one piece type, e.g. "Yahhta ×2". */
  describePiece: (type: string, count: number) => string;
  selected?: string | null;
  canSelect?: (type: string) => boolean;
  onSelect?: (type: string) => void;
  /** Board to drop onto by dragging; without it pieces are placed by tap-then-tap. */
  board?: RefObject<BoardHandle | null>;
  onDropOnBoard?: (type: string, square: Square) => boolean;
  className?: string;
}

interface DragState {
  type: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

const DRAG_THRESHOLD = 6;
const DRAG_SIZE = 56;

/** Pieces a side holds in hand (Sittuyin setup, drops), grouped by type with a count. */
export function HandTray({
  color,
  pieces,
  theme,
  renderPiece,
  label,
  describePiece,
  selected = null,
  canSelect,
  onSelect,
  board,
  onDropOnBoard,
  className,
}: HandTrayProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const counts = new Map<string, number>();
  for (const type of pieces) counts.set(type, (counts.get(type) ?? 0) + 1);

  const startDrag = (type: string, e: ReactPointerEvent) => {
    if (!canSelect?.(type) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    setDrag({ type, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, active: false });
  };

  const moveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const active = drag.active || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > DRAG_THRESHOLD;
    if (active && !drag.active) e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, active });
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.active) {
      const square = board?.current?.squareAt(e.clientX, e.clientY) ?? null;
      if (square !== null) onDropOnBoard?.(drag.type, square);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDrag(null);
  };

  return (
    <>
      <div
        role="group"
        aria-label={label}
        data-hand={color}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDrag(null)}
        className={['flex min-h-14 touch-none flex-wrap gap-1 rounded-lg border-2 p-1', className].filter(Boolean).join(' ')}
        style={{ borderColor: theme.line, background: theme.board }}
      >
        {[...counts].map(([type, count]) => {
          const enabled = canSelect?.(type) ?? false;
          return (
            <button
              key={type}
              type="button"
              data-hand-piece={type}
              data-count={count}
              aria-pressed={selected === type}
              aria-label={describePiece(type, count)}
              disabled={!enabled}
              onPointerDown={(e) => startDrag(type, e)}
              onClick={() => onSelect?.(type)}
              className="relative h-12 w-12 select-none rounded-md disabled:opacity-60"
              style={{ background: selected === type ? theme.selected : undefined }}
            >
              <span className={drag?.active && drag.type === type ? 'opacity-30' : undefined}>
                {renderPiece({ color, type, promoted: false }, 'h-full w-full drop-shadow-sm')}
              </span>
              {count > 1 && (
                <span
                  className="absolute bottom-0 right-0 rounded-full px-1.5 text-xs font-bold leading-5"
                  style={{ background: theme.line, color: theme.board }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {drag?.active && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50"
          style={{ left: drag.x - DRAG_SIZE / 2, top: drag.y - DRAG_SIZE / 2, width: DRAG_SIZE, height: DRAG_SIZE }}
        >
          {renderPiece({ color, type: drag.type, promoted: false }, 'h-full w-full drop-shadow-xl')}
        </div>
      )}
    </>
  );
}
