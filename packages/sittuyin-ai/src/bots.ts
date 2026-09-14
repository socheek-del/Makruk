import type { BotPersona } from '@chaturanga/ai-core';

export interface SittuyinBot extends BotPersona {
  /** i18n key suffix and persona name, after the Sittuyin pieces. */
  key: 'ne' | 'sitke' | 'sin' | 'myin' | 'yahhta' | 'mingyi';
  /** Random score noise for setup placements (0 = always the arrangement it likes best). */
  setupNoise: number;
}

/**
 * Bots named after the pieces, from Ne (novice) to Min-gyi (master). Search budgets start from the
 * ladder-verified Makruk line-up; the Sittuyin strength ladder (sit-004) decides the final values.
 */
export const BOTS: readonly SittuyinBot[] = [
  { id: 1, key: 'ne', maxDepth: 1, maxNodes: 3_000, timeMs: 400, noise: 250, blunderRate: 0.4, setupNoise: 60 },
  { id: 2, key: 'sitke', maxDepth: 1, maxNodes: 6_000, timeMs: 500, noise: 60, blunderRate: 0.12, setupNoise: 30 },
  { id: 3, key: 'sin', maxDepth: 2, maxNodes: 30_000, timeMs: 700, noise: 40, blunderRate: 0.06, setupNoise: 20 },
  { id: 4, key: 'myin', maxDepth: 3, maxNodes: 120_000, timeMs: 1_000, noise: 30, blunderRate: 0.02, setupNoise: 10 },
  { id: 5, key: 'yahhta', maxDepth: 4, maxNodes: 400_000, timeMs: 1_800, noise: 0, blunderRate: 0, setupNoise: 5 },
  { id: 6, key: 'mingyi', maxDepth: 8, maxNodes: 1_500_000, timeMs: 3_000, noise: 0, blunderRate: 0, setupNoise: 0 },
];

export function botById(id: number): SittuyinBot {
  return BOTS.find((b) => b.id === id) ?? BOTS[0]!;
}
