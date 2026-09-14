/**
 * The two long diagonals a Ne promotes on. They are rules made visible, not decoration
 * (apps/sittuyin/docs/design.md), so every Sittuyin board draws them.
 */
export function PromotionDiagonals({ colour }: { colour: string }) {
  return (
    <svg viewBox="0 0 8 8" preserveAspectRatio="none" className="h-full w-full" data-diagonals>
      <g stroke={colour} strokeWidth="0.05" strokeLinecap="round">
        <line x1="0" y1="0" x2="8" y2="8" />
        <line x1="8" y1="0" x2="0" y2="8" />
      </g>
    </svg>
  );
}
