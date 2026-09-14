/**
 * Sittuyin computer opponent: ai-core alpha-beta search on the Sittuyin engine, with a heuristic policy
 * for the setup phase. Runs in a Web Worker in the browser; pure and deterministic given `rng`.
 */
import { type EngineMove, pickRootMove, search } from '@chaturanga/ai-core';
import { encodedToUci, generateLegalMoves, isDrop, parseFen } from '@chaturanga/sittuyin/core';
import { SittuyinSearch } from './adapter';
import { botById, type SittuyinBot } from './bots';
import { materialBalance } from './evaluate';
import { chooseSetupMove } from './setup';

export { mulberry32 } from '@chaturanga/ai-core';
export { positionKey, SittuyinSearch } from './adapter';
export { BOTS, botById, type SittuyinBot } from './bots';
export { evaluate, materialBalance } from './evaluate';
export { chooseSetupMove, setupScore } from './setup';
export type { EngineMove };

/** Bots treat repeating a position as slightly worse than a draw, so they keep trying to make progress. */
export const DEFAULT_CONTEMPT = 30;
/** Material lead (centipawns) at which a bot switches into conversion mode. */
export const CONVERSION_MARGIN = 500;
/** Extra search depth in conversion mode (endgames have few pieces, so this stays cheap). */
export const CONVERSION_EXTRA_DEPTH = 2;

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  /** Use the node budget only (no wall clock) — for reproducible tests. */
  ignoreTime?: boolean;
  /** Earlier positions of the game (positionKey), for repetition avoidance. */
  history?: readonly string[];
}

/**
 * A clearly winning bot (big material lead, or a count already running while it is ahead) plays without
 * noise or blunders and searches deeper, so weak personas can still finish a won endgame in time.
 */
export function inConversion(fen: string): boolean {
  const pos = parseFen(fen);
  const lead = materialBalance(pos, pos.turn);
  return lead >= CONVERSION_MARGIN || (pos.countingLimit > 0 && lead > 0);
}

/** Picks a move for a bot level, including setup placements. Returns null when there is no legal move. */
export function chooseMove(fen: string, level: SittuyinBot | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const rng = options.rng ?? Math.random;
  const now = options.now ?? (() => Date.now());
  const pos = parseFen(fen);
  const legal = generateLegalMoves(pos);
  if (legal.length === 0) return null;

  if (isDrop(legal[0]!)) {
    return { uci: encodedToUci(chooseSetupMove(pos, legal, persona.setupNoise, rng)), score: 0, depth: 0, nodes: 0 };
  }

  const bot = inConversion(fen)
    ? { ...persona, noise: 0, blunderRate: 0, maxDepth: persona.maxDepth + CONVERSION_EXTRA_DEPTH }
    : persona;
  if (rng() < bot.blunderRate) {
    return { uci: encodedToUci(legal[Math.floor(rng() * legal.length)]!), score: 0, depth: 0, nodes: 0 };
  }

  const result = search(new SittuyinSearch(pos), {
    maxDepth: bot.maxDepth,
    maxNodes: bot.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + bot.timeMs,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    // Only noisy bots choose among root moves by score; the rest search much deeper without exact scores.
    exactRootScores: bot.noise > 0,
  });
  const pick = pickRootMove(result, bot.noise, rng);
  return { uci: encodedToUci(pick.move), score: pick.score, depth: result.depth, nodes: result.nodes };
}

/** Strongest move within a budget, for hints; the best-scoring placement during setup. */
export function bestMove(
  fen: string,
  options: { maxDepth?: number; maxNodes?: number; timeMs?: number; now?: () => number; history?: readonly string[] } = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const pos = parseFen(fen);
  const legal = generateLegalMoves(pos);
  if (legal.length === 0) return null;
  if (isDrop(legal[0]!)) {
    return { uci: encodedToUci(chooseSetupMove(pos, legal, 0, () => 0)), score: 0, depth: 0, nodes: 0 };
  }
  const result = search(new SittuyinSearch(pos), {
    maxDepth: options.maxDepth ?? 4,
    maxNodes: options.maxNodes ?? 300_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: false,
  });
  return { uci: encodedToUci(result.move), score: result.score, depth: result.depth, nodes: result.nodes };
}
