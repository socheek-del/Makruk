import type { Piece } from '@makruk/engine';
import type { ReactNode } from 'react';

/**
 * Placeholder "classic" piece set (simple Makruk silhouettes). Final in-house art replaces
 * this in art-001; keep the same props so the board does not change.
 */
const PALETTE = {
  w: { body: '#fff8ec', outline: '#3b2a1a', accent: '#c98a3a' },
  b: { body: '#3a2e29', outline: '#0f0a07', accent: '#e9d3a6' },
} as const;

const SHAPES: Record<Piece['type'], (accent: string) => ReactNode> = {
  k: (accent) => (
    <>
      <path d="M31 80 C31 62 36 52 40 45 H60 C64 52 69 62 69 80 Z" />
      <path d="M36 45 L33 23 L43 31 L50 16 L57 31 L67 23 L64 45 Z" />
      <circle cx="50" cy="16" r="4" fill={accent} />
    </>
  ),
  m: (accent) => (
    <>
      <path d="M27 80 C27 54 36 40 50 40 C64 40 73 54 73 80 Z" />
      <circle cx="50" cy="31" r="8" />
      <path d="M38 62 H62" stroke={accent} />
    </>
  ),
  s: (accent) => (
    <>
      <path d="M29 80 C29 58 40 36 50 20 C60 36 71 58 71 80 Z" />
      <path d="M36 60 H64" stroke={accent} />
    </>
  ),
  n: (accent) => (
    <>
      <path d="M30 80 C30 64 35 55 43 49 C37 47 33 41 35 33 C39 22 52 15 63 21 C71 26 75 40 71 53 C69 61 71 71 73 80 Z" />
      <circle cx="55" cy="32" r="3.5" fill={accent} stroke="none" />
    </>
  ),
  r: (accent) => (
    <>
      <path d="M28 80 L32 46 H68 L72 80 Z" />
      <path d="M30 46 V30 H40 V37 H46 V30 H54 V37 H60 V30 H70 V46 Z" />
      <path d="M38 64 H62" stroke={accent} />
    </>
  ),
  p: (accent) => (
    <>
      <ellipse cx="50" cy="68" rx="27" ry="13" />
      <ellipse cx="50" cy="60" rx="17" ry="9" />
      <path d="M44 60 H56" stroke={accent} />
    </>
  ),
};

export interface PieceSvgProps {
  piece: Piece;
  className?: string;
}

export function PieceSvg({ piece, className }: PieceSvgProps) {
  const colors = PALETTE[piece.color];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false">
      <g fill={colors.body} stroke={colors.outline} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round">
        <rect x="20" y="78" width="60" height="10" rx="5" />
        {SHAPES[piece.type](colors.accent)}
        {piece.promoted && <circle cx="72" cy="26" r="9" fill={colors.accent} />}
      </g>
    </svg>
  );
}
