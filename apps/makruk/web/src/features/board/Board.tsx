import { type Color, type Piece, type Square, squareName } from '@chaturanga/makruk';
import type React from 'react';
import { type PointerEvent as ReactPointerEvent, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { PieceSvg } from './PieceSvg';
import type { BoardTheme } from './themes';

export interface BoardProps {
  pieces: ReadonlyArray<{ square: Square; piece: Piece }>;
  theme: BoardTheme;
  orientation?: Color;
  showCoordinates?: boolean;
  selected?: Square | null;
  targets?: ReadonlyArray<Square>;
  lastMove?: { from: Square; to: Square } | null;
  checkSquare?: Square | null;
  /** Suggested move from the hint engine. */
  hint?: { from: Square; to: Square } | null;
  /** Slide the piece that just moved; `key` changes once per move. */
  animate?: { from: Square; to: Square; key: string } | null;
  onSquareClick?: (square: Square) => void;
  canDrag?: (square: Square) => boolean;
  onDrop?: (from: Square, to: Square) => boolean;
  className?: string;
}

interface DragState {
  from: Square;
  piece: Piece;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  size: number;
  active: boolean;
}

/** Pointer travel (px) before a press becomes a drag; shorter presses are taps. */
const DRAG_THRESHOLD = 6;

/** Squares in display order: top-left first. */
function displayOrder(orientation: Color): Square[] {
  const squares: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rank = orientation === 'w' ? 7 - row : row;
      const file = orientation === 'w' ? col : 7 - col;
      squares.push(rank * 8 + file);
    }
  }
  return squares;
}

export const pieceCode = (piece: Piece): string => `${piece.color}${piece.type}${piece.promoted ? '~' : ''}`;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(REDUCED_MOTION);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function Board({
  pieces,
  theme,
  orientation = 'w',
  showCoordinates = true,
  selected = null,
  targets = [],
  lastMove = null,
  checkSquare = null,
  hint = null,
  animate = null,
  onSquareClick,
  canDrag,
  onDrop,
  className,
}: BoardProps) {
  const { t } = useTranslation();
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const droppedOn = useRef<Square | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const displayPos = (square: Square) => {
    const file = square & 7;
    const rank = square >> 3;
    return orientation === 'w' ? { col: file, row: 7 - rank } : { col: 7 - file, row: rank };
  };
  // Drag-and-drop already put the piece in place, and reduced-motion users get no sliding.
  const slide =
    animate && !reducedMotion && droppedOn.current !== animate.to
      ? { to: animate.to, key: animate.key, dx: displayPos(animate.from).col - displayPos(animate.to).col, dy: displayPos(animate.from).row - displayPos(animate.to).row }
      : null;
  const bySquare = new Map(pieces.map((p) => [p.square, p.piece]));
  const targetSet = new Set(targets);

  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  const squareAt = (clientX: number, clientY: number): Square | null => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const rank = orientation === 'w' ? 7 - row : row;
    const file = orientation === 'w' ? col : 7 - col;
    return rank * 8 + file;
  };

  const startDrag = (square: Square, e: ReactPointerEvent) => {
    const piece = bySquare.get(square);
    if (!piece || !canDrag?.(square) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const rect = boardRef.current?.getBoundingClientRect();
    setDrag({
      from: square,
      piece,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      size: rect ? (rect.width / 8) * 1.15 : 48,
      active: false,
    });
  };

  const moveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const active = drag.active || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > DRAG_THRESHOLD;
    // Capture only once it is a real drag, so plain taps still produce a click on the square.
    if (active && !drag.active) e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, active });
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.active) {
      const to = squareAt(e.clientX, e.clientY);
      if (to !== null && to !== drag.from && onDrop?.(drag.from, to)) droppedOn.current = to;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDrag(null);
  };

  const hovered = drag?.active ? squareAt(drag.x, drag.y) : null;

  return (
    <>
      <div
        ref={boardRef}
        role="grid"
        aria-label={t('board.label')}
        data-orientation={orientation}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDrag(null)}
        className={cn(
          'grid aspect-square w-full touch-none grid-cols-8 grid-rows-8 gap-px rounded-lg border-4 p-px shadow-lg',
          className,
        )}
        style={{ background: theme.line, borderColor: theme.line }}
      >
        {displayOrder(orientation).map((square, index) => {
          const name = squareName(square);
          const piece = bySquare.get(square);
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isTarget = targetSet.has(square);
          const isLast = !!lastMove && (square === lastMove.from || square === lastMove.to);
          const highlight = square === selected ? theme.selected : isLast ? theme.lastMove : undefined;
          const dragging = drag?.active && drag.from === square;

          return (
            <button
              key={square}
              type="button"
              role="gridcell"
              data-square={name}
              data-target={isTarget || undefined}
              data-last-move={isLast || undefined}
              data-check={square === checkSquare || undefined}
              data-hint={(!!hint && (square === hint.from || square === hint.to)) || undefined}
              aria-label={
                piece
                  ? t('board.squareWithPiece', { square: name, piece: pieceName(piece) })
                  : t('board.emptySquare', { square: name })
              }
              aria-selected={square === selected}
              onPointerDown={(e) => startDrag(square, e)}
              onClick={() => onSquareClick?.(square)}
              className="relative min-h-0 min-w-0 select-none focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-secondary"
              style={{ background: theme.board }}
            >
              {highlight && <span className="absolute inset-0" style={{ background: highlight }} />}
              {hovered === square && <span className="absolute inset-0 border-4" style={{ borderColor: theme.selected }} />}
              {hint && (square === hint.from || square === hint.to) && (
                <span className="absolute inset-0 animate-pulse border-4 border-gold bg-gold/25" />
              )}
              {square === checkSquare && (
                <span
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(circle, ${theme.check} 0%, ${theme.check} 35%, transparent 75%)` }}
                />
              )}
              {showCoordinates && col === 0 && (
                <span
                  className="absolute left-0.5 top-0 text-[clamp(8px,2.2vw,12px)] font-bold leading-none"
                  style={{ color: theme.coordinate }}
                >
                  {name[1]}
                </span>
              )}
              {showCoordinates && row === 7 && (
                <span
                  className="absolute bottom-0 right-0.5 text-[clamp(8px,2.2vw,12px)] font-bold leading-none"
                  style={{ color: theme.coordinate }}
                >
                  {name[0]}
                </span>
              )}
              {piece && (
                <span
                  key={slide?.to === square ? slide.key : 'still'}
                  data-piece={pieceCode(piece)}
                  data-animating={slide?.to === square || undefined}
                  className={cn('absolute inset-[4%]', dragging && 'opacity-30', slide?.to === square && 'piece-slide z-10')}
                  style={
                    slide?.to === square
                      ? ({ '--dx': `${slide.dx * 108.7}%`, '--dy': `${slide.dy * 108.7}%` } as React.CSSProperties)
                      : undefined
                  }
                >
                  <PieceSvg piece={piece} className="h-full w-full drop-shadow-sm" />
                </span>
              )}
              {isTarget &&
                (piece ? (
                  <span className="absolute inset-[6%] rounded-full border-[6px]" style={{ borderColor: theme.hint }} />
                ) : (
                  <span
                    className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: theme.hint }}
                  />
                ))}
            </button>
          );
        })}
      </div>
      {drag?.active && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50"
          style={{ left: drag.x - drag.size / 2, top: drag.y - drag.size / 2, width: drag.size, height: drag.size }}
        >
          <PieceSvg piece={drag.piece} className="h-full w-full drop-shadow-xl" />
        </div>
      )}
    </>
  );
}
