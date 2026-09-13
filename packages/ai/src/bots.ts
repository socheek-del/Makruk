export interface BotLevel {
  id: number;
  /** i18n key suffix and persona name. */
  key: 'bia' | 'met' | 'khon' | 'ma' | 'ruea' | 'khun';
  maxDepth: number;
  /** Node budget: makes strength deterministic across devices. */
  maxNodes: number;
  /** Wall-clock cap in the browser. */
  timeMs: number;
  /** Random centipawn noise added to root move scores. */
  noise: number;
  /** Chance of playing a random legal move instead of searching. */
  blunderRate: number;
}

/** Bots named after the pieces, from Bia (novice) to Khun (master). */
export const BOTS: readonly BotLevel[] = [
  { id: 1, key: 'bia', maxDepth: 1, maxNodes: 3_000, timeMs: 400, noise: 250, blunderRate: 0.4 },
  { id: 2, key: 'met', maxDepth: 1, maxNodes: 6_000, timeMs: 500, noise: 60, blunderRate: 0.12 },
  { id: 3, key: 'khon', maxDepth: 2, maxNodes: 30_000, timeMs: 700, noise: 40, blunderRate: 0.06 },
  { id: 4, key: 'ma', maxDepth: 3, maxNodes: 120_000, timeMs: 1_000, noise: 10, blunderRate: 0 },
  { id: 5, key: 'ruea', maxDepth: 4, maxNodes: 400_000, timeMs: 1_800, noise: 0, blunderRate: 0 },
  { id: 6, key: 'khun', maxDepth: 6, maxNodes: 1_500_000, timeMs: 3_000, noise: 0, blunderRate: 0 },
];

export function botById(id: number): BotLevel {
  return BOTS.find((b) => b.id === id) ?? BOTS[0]!;
}
