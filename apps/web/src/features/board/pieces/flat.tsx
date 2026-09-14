import type { Piece } from '@makruk/engine';
import { SHAPES } from './classic';

/**
 * theme-002: "modern flat" set — the same Makruk silhouettes as solid shapes with a soft bottom shadow
 * instead of outlines and carving details. Marks use the app's indigo and temple gold.
 */
const FLAT = {
  w: { fill: '#fffdf9', shadow: '#bdb4a4', mark: '#3a3f9b' },
  b: { fill: '#2a2838', shadow: '#12111c', mark: '#e2b65a' },
} as const;

export function FlatPiece({ piece, className }: { piece: Piece; className?: string }) {
  const colors = FLAT[piece.color];
  const shape = SHAPES[piece.promoted ? 'p' : piece.type];
  const outline = piece.color === 'w' ? '#2a2838' : '#12111c';
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
