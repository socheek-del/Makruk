import type { Piece } from '@makruk/engine';
import { SHAPES } from './classic';

/**
 * theme-002: "modern flat" set — the same Makruk silhouettes as solid Duolingo-style shapes with a
 * soft bottom shadow instead of outlines and carving details.
 */
const FLAT = {
  w: { fill: '#ffffff', shadow: '#b8b8b8', mark: '#1cb0f6' },
  b: { fill: '#3c3c3c', shadow: '#141414', mark: '#ffc800' },
} as const;

export function FlatPiece({ piece, className }: { piece: Piece; className?: string }) {
  const colors = FLAT[piece.color];
  const shape = SHAPES[piece.promoted ? 'p' : piece.type];
  const outline = piece.color === 'w' ? '#3c3c3c' : '#141414';
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" data-set="flat" data-type={piece.promoted ? 'p~' : piece.type}>
      <g transform="translate(0 4)" fill={colors.shadow}>
        <rect x="21" y="78" width="58" height="10" rx="5" />
        {shape.body.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill={colors.fill} stroke={outline} strokeWidth={piece.color === 'w' ? 2.5 : 0} strokeLinejoin="round">
        <rect x="21" y="78" width="58" height="10" rx="5" />
        {shape.body.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {piece.promoted && <path d="M38 55 L41 43 L47 49 L50 40 L53 49 L59 43 L62 55 Z" fill={colors.mark} />}
      {piece.type === 'k' && !piece.promoted && <circle cx="50" cy="16" r="5" fill={colors.mark} />}
    </svg>
  );
}
