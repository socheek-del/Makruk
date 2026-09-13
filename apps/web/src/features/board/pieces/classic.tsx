import type { Piece } from '@makruk/engine';
import type { ReactNode } from 'react';

/**
 * art-001: final in-house "classic" Makruk piece set. Silhouettes follow traditional carved pieces:
 * crowned Khun, lotus-bud Met, temple-spire Khon, horse-head Ma, boat-hull Ruea and cowrie-shell Bia.
 * Drawn on a 100×100 grid with thick rounded outlines so they stay readable at ~36px.
 */
export const CLASSIC_PALETTE = {
  w: { body: '#fdf3e1', shade: '#e6cfa6', outline: '#3b2717', accent: '#c8902c', shine: '#ffffff' },
  b: { body: '#3a2d27', shade: '#221a16', outline: '#0d0806', accent: '#d9a441', shine: '#6e5a4c' },
} as const;

type Palette = (typeof CLASSIC_PALETTE)[keyof typeof CLASSIC_PALETTE];

const BASE = 'M19 85 Q19 78 27 78 H73 Q81 78 81 85 Q81 91 74 91 H26 Q19 91 19 85 Z';

export const SHAPES: Record<Piece['type'], { body: string[]; details: (p: Palette) => ReactNode }> = {
  k: {
    body: [
      'M30 78 C30 63 35 53 41 46 H59 C65 53 70 63 70 78 Z',
      'M38 47 L35 31 L44 36 L50 21 L56 36 L65 31 L62 47 Z',
    ],
    details: (p) => (
      <>
        <circle cx="50" cy="16" r="4.5" fill={p.accent} />
        <path d="M37 58 H63" stroke={p.accent} strokeWidth="4" />
        <path d="M41 40 H59" stroke={p.accent} strokeWidth="3" />
        <path d="M38 64 C38 70 40 74 42 76" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.7" />
      </>
    ),
  },
  m: {
    body: ['M29 78 C27 63 35 52 50 46 C65 52 73 63 71 78 Z', 'M50 19 C59 27 61 37 50 46 C39 37 41 27 50 19 Z'],
    details: (p) => (
      <>
        <path d="M36 61 H64" stroke={p.accent} strokeWidth="4" />
        <path d="M50 26 V39" stroke={p.accent} strokeWidth="3" />
        <path d="M37 66 C37 71 39 74 41 76" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.7" />
      </>
    ),
  },
  s: {
    body: ['M28 78 C30 66 36 58 42 54 H58 C64 58 70 66 72 78 Z', 'M42 55 L46 40 L50 13 L54 40 L58 55 Z'],
    details: (p) => (
      <>
        <path d="M45 44 H55" stroke={p.accent} strokeWidth="3" />
        <path d="M35 66 H65" stroke={p.accent} strokeWidth="4" />
        <path d="M36 70 C36 73 38 75 40 76" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.7" />
      </>
    ),
  },
  n: {
    body: [
      'M31 78 C29 63 33 55 41 49 C35 47 31 41 33 33 C35 24 43 16 56 16 C67 16 75 26 75 39 C75 49 70 57 70 67 L71 78 Z',
    ],
    details: (p) => (
      <>
        <path d="M57 18 C49 26 46 35 49 46 C51 52 55 55 58 57" stroke={p.accent} strokeWidth="4" fill="none" />
        <circle cx="45" cy="30" r="3.5" fill={p.outline} stroke="none" />
        <path d="M36 39 C38 41 40 41 42 40" stroke={p.outline} strokeWidth="2.5" fill="none" />
        <path d="M37 66 C37 71 39 74 41 76" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.7" />
      </>
    ),
  },
  r: {
    body: ['M26 78 L31 52 H69 L74 78 Z', 'M27 53 C27 42 36 37 50 37 C64 37 73 42 73 53 Z'],
    details: (p) => (
      <>
        <path d="M33 63 H67 M31 71 H69" stroke={p.accent} strokeWidth="3.5" />
        <path d="M50 37 V25 M50 25 L60 31 L50 33" stroke={p.outline} strokeWidth="3.5" fill={p.accent} />
        <path d="M34 57 C34 62 34 70 33 76" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.7" />
      </>
    ),
  },
  p: {
    body: ['M25 78 C25 61 37 54 50 54 C63 54 75 61 75 78 Z'],
    details: (p) => (
      <>
        <path d="M50 58 V75" stroke={p.outline} strokeWidth="3" />
        <path d="M45 62 H49 M45 68 H49 M51 62 H55 M51 68 H55" stroke={p.accent} strokeWidth="2.5" />
        <path d="M32 72 C32 66 35 62 39 60" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.7" />
      </>
    ),
  },
};

/** Tiara added to a promoted Bia (Bia Ngai) so it reads as a Met-moving Bia. */
export function PromotionMark({ palette }: { palette: Palette }) {
  return <path d="M38 55 L41 43 L47 49 L50 40 L53 49 L59 43 L62 55 Z" fill={palette.accent} stroke={palette.outline} strokeWidth="3.5" />;
}

export function ClassicPiece({ piece, className }: { piece: Piece; className?: string }) {
  const palette = CLASSIC_PALETTE[piece.color];
  // A promoted Bia keeps the cowrie body so players can tell it from an original Met.
  const shape = SHAPES[piece.promoted ? 'p' : piece.type];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" data-set="classic" data-type={piece.promoted ? 'p~' : piece.type}>
      <g stroke={palette.outline} strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round">
        <path d={BASE} fill={palette.shade} />
        {shape.body.map((d) => (
          <path key={d} d={d} fill={palette.body} />
        ))}
        {shape.details(palette)}
        {piece.promoted && <PromotionMark palette={palette} />}
      </g>
    </svg>
  );
}
