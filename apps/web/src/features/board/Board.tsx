import { type Color, type Piece, type Square, squareName } from '@makruk/engine';
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
  onSquareClick?: (square: Square) => void;
  className?: string;
}

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

export function Board({
  pieces,
  theme,
  orientation = 'w',
  showCoordinates = true,
  selected = null,
  targets = [],
  lastMove = null,
  checkSquare = null,
  onSquareClick,
  className,
}: BoardProps) {
  const { t } = useTranslation();
  const bySquare = new Map(pieces.map((p) => [p.square, p.piece]));
  const targetSet = new Set(targets);

  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  return (
    <div
      role="grid"
      aria-label={t('board.label')}
      data-orientation={orientation}
      className={cn('grid aspect-square w-full grid-cols-8 grid-rows-8 gap-px rounded-lg border-4 p-px shadow-lg', className)}
      style={{ background: theme.line, borderColor: theme.line }}
    >
      {displayOrder(orientation).map((square, index) => {
        const name = squareName(square);
        const piece = bySquare.get(square);
        const row = Math.floor(index / 8);
        const col = index % 8;
        const isTarget = targetSet.has(square);
        const highlight =
          square === selected ? theme.selected : lastMove && (square === lastMove.from || square === lastMove.to) ? theme.lastMove : undefined;

        return (
          <button
            key={square}
            type="button"
            role="gridcell"
            data-square={name}
            data-target={isTarget || undefined}
            aria-label={piece ? t('board.squareWithPiece', { square: name, piece: pieceName(piece) }) : t('board.emptySquare', { square: name })}
            aria-selected={square === selected}
            onClick={() => onSquareClick?.(square)}
            className="relative min-h-0 min-w-0 touch-manipulation select-none focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-secondary"
            style={{ background: theme.board }}
          >
            {highlight && <span className="absolute inset-0" style={{ background: highlight }} />}
            {square === checkSquare && (
              <span
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle, ${theme.check} 0%, ${theme.check} 35%, transparent 75%)` }}
              />
            )}
            {showCoordinates && col === 0 && (
              <span className="absolute left-0.5 top-0 text-[clamp(8px,2.2vw,12px)] font-bold leading-none" style={{ color: theme.coordinate }}>
                {name[1]}
              </span>
            )}
            {showCoordinates && row === 7 && (
              <span className="absolute bottom-0 right-0.5 text-[clamp(8px,2.2vw,12px)] font-bold leading-none" style={{ color: theme.coordinate }}>
                {name[0]}
              </span>
            )}
            {piece && (
              <span data-piece={pieceCode(piece)} className="absolute inset-[4%]">
                <PieceSvg piece={piece} className="h-full w-full drop-shadow-sm" />
              </span>
            )}
            {isTarget &&
              (piece ? (
                <span className="absolute inset-[6%] rounded-full border-[6px]" style={{ borderColor: theme.hint }} />
              ) : (
                <span className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: theme.hint }} />
              ))}
          </button>
        );
      })}
    </div>
  );
}
