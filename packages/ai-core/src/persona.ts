import { MATE, type RootMove, type SearchResult } from './search';

/** A bot's strength settings. Each game names its own line-up (usually after its pieces). */
export interface BotPersona {
  id: number;
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

export interface EngineMove {
  uci: string;
  score: number;
  depth: number;
  nodes: number;
}

/**
 * The root move a bot plays: the best one, or — for noisy personas — the best after adding ±noise
 * centipawns to every score. A found mate is always played.
 */
export function pickRootMove(result: SearchResult, noise: number, rng: () => number): RootMove {
  const best = result.rootMoves[0]!;
  if (noise <= 0 || best.score >= MATE - 100) return best;
  const noisy = result.rootMoves.map((r) => ({ ...r, noisy: r.score + (rng() * 2 - 1) * noise }));
  noisy.sort((a, b) => b.noisy - a.noisy);
  const { move, score } = noisy[0]!;
  return { move, score };
}
