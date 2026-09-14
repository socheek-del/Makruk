import type { Piece } from '@chaturanga/sittuyin';
import type { ReactNode } from 'react';

/**
 * sit-005: the in-house "yun" Sittuyin piece set (apps/sittuyin/docs/design.md). Forms follow Bagan
 * lacquerware: a filled silhouette, one incised brass line and one soft highlight. Drawn on a 100×100
 * grid with heavy rounded outlines.
 *
 * The set is built around the silhouette, because that is all a 40px square shows: a tiered umbrella
 * (Min-gyi), a pointed shield (Sit-ke), a trunk (Sin), a cut mane (Myin), a wheel (Yahhta) and a small
 * dome (Ne). Height and width differ on purpose — Min-gyi is the tallest, Ne the smallest — so the
 * pieces are told apart by outline alone.
 */
export const YUN_PALETTE = {
  w: { body: '#f7ecd9', shade: '#d8bd93', outline: '#2a1a12', accent: '#a8802f', shine: '#ffffff' },
  b: { body: '#2c2320', shade: '#7a2a1c', outline: '#0b0605', accent: '#c79a45', shine: '#6b554a' },
} as const;

type Palette = (typeof YUN_PALETTE)[keyof typeof YUN_PALETTE];

/** A narrow lacquer foot: present enough to seat the piece, never wide enough to dominate it. */
const BASE = 'M29 82 Q29 77 36 77 H64 Q71 77 71 82 Q71 88 65 88 H35 Q29 88 29 82 Z';

export const SHAPES: Record<string, { body: string[]; details: (p: Palette) => ReactNode }> = {
  // Min-gyi: a figure under the tiered royal umbrella (hti). The only piece that is widest at the top.
  k: {
    body: [
      'M38 77 C38 64 42 57 50 53 C58 57 62 64 62 77 Z',
      'M47 42 H53 V54 H47 Z',
      'M20 43 C20 35 34 29 50 29 C66 29 80 35 80 43 Z',
      'M28 29 C28 22 38 17 50 17 C62 17 72 22 72 29 Z',
      'M37 17 C37 12 43 9 50 9 C57 9 63 12 63 17 Z',
    ],
    details: (p) => (
      <>
        <circle cx="50" cy="6" r="3.5" fill={p.accent} stroke="none" />
        <path d="M26 43 H74" stroke={p.accent} strokeWidth="3" />
        <path d="M41 68 H59" stroke={p.accent} strokeWidth="3.5" />
        <path d="M42 60 C41 66 41 72 42 76" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.65" />
      </>
    ),
  },
  // Sit-ke: a shield pointed at both ends. A promoted Ne becomes one of these.
  f: {
    body: ['M50 8 L71 24 C75 46 67 68 50 83 C33 68 25 46 29 24 Z'],
    details: (p) => (
      <>
        <path d="M50 26 C58 36 58 48 50 58 C42 48 42 36 50 26 Z" fill={p.accent} stroke="none" />
        <path d="M38 66 H62" stroke={p.accent} strokeWidth="3.5" />
        <path d="M34 34 C32 48 36 62 43 72" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.65" />
      </>
    ),
  },
  // Sin: an elephant, read by the trunk falling down the left side.
  s: {
    body: [
      'M40 80 C30 60 34 38 50 31 C66 24 79 36 80 53 C81 66 76 74 74 80 Z',
      'M48 46 C38 55 33 68 35 80 H22 C18 62 26 46 40 39 Z',
    ],
    details: (p) => (
      <>
        <circle cx="61" cy="45" r="4" fill={p.outline} stroke="none" />
        <path d="M47 62 C54 66 62 68 70 67" stroke={p.accent} strokeWidth="3.5" fill="none" />
        <path d="M63 56 C70 58 75 62 78 68" stroke={p.accent} strokeWidth="3" fill="none" />
        <path d="M30 60 C28 68 28 74 29 79" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.65" />
      </>
    ),
  },
  // Myin: a horse head with a stepped mane down the right, facing the opposite way to Makruk's Ma.
  n: {
    body: [
      'M70 80 C73 62 67 53 58 47 C65 43 69 34 65 25 C60 14 48 9 36 13 C24 17 18 30 21 43 C23 53 28 59 28 69 L27 80 Z',
    ],
    details: (p) => (
      <>
        <path d="M37 15 C47 24 51 35 48 47 C46 54 41 58 37 60" stroke={p.accent} strokeWidth="4" fill="none" />
        <circle cx="53" cy="30" r="4" fill={p.outline} stroke="none" />
        <path d="M64 42 C61 44 58 44 56 43" stroke={p.outline} strokeWidth="2.5" fill="none" />
        <path d="M26 46 C24 57 27 67 29 75" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.65" />
      </>
    ),
  },
  // Yahhta: the chariot wheel is the silhouette — the only round piece in the set.
  r: {
    body: ['M50 12 A31 31 0 1 1 49.9 12 Z'],
    details: (p) => (
      <>
        <circle cx="50" cy="43" r="20" fill="none" stroke={p.accent} strokeWidth="4" />
        <path d="M50 23 V63 M30 43 H70 M36 29 L64 57 M64 29 L36 57" stroke={p.accent} strokeWidth="2.5" />
        <circle cx="50" cy="43" r="5.5" fill={p.accent} stroke="none" />
        <path d="M24 55 C22 47 23 38 27 31" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.65" />
      </>
    ),
  },
  // Ne: the smallest piece — a low dome with a topknot.
  p: {
    body: ['M34 77 C34 63 41 56 50 56 C59 56 66 63 66 77 Z', 'M50 41 C56 46 56 52 50 56 C44 52 44 46 50 41 Z'],
    details: (p) => (
      <>
        <path d="M39 68 H61" stroke={p.accent} strokeWidth="3.5" />
        <path d="M41 73 C41 68 43 63 46 61" stroke={p.shine} strokeWidth="3" fill="none" opacity="0.65" />
      </>
    ),
  },
};

/** A brass collar, so a player can see which Sit-ke started life as a Ne. */
export function PromotionMark({ palette }: { palette: Palette }) {
  return (
    <>
      <ellipse cx="50" cy="77" rx="17" ry="6" fill="none" stroke={palette.outline} strokeWidth="6" />
      <ellipse cx="50" cy="77" rx="17" ry="6" fill="none" stroke={palette.accent} strokeWidth="3.5" />
    </>
  );
}

export function YunPiece({ piece, className }: { piece: Piece; className?: string }) {
  const palette = YUN_PALETTE[piece.color];
  const shape = SHAPES[piece.type] ?? SHAPES.p!;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      focusable="false"
      data-set="yun"
      data-type={piece.promoted ? `${piece.type}~` : piece.type}
    >
      <g stroke={palette.outline} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
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
