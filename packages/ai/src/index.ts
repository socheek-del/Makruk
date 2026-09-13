/**
 * Makruk computer opponent: alpha-beta search on the engine's core API.
 * Runs in a Web Worker in the browser; pure and deterministic given `rng`.
 */
import * as core from '@makruk/engine/core';
import { type BotLevel, botById } from './bots';
import { materialBalance } from './evaluate';
import { MATE, search } from './search';

export { type BotLevel, BOTS, botById } from './bots';
export { evaluate, materialBalance } from './evaluate';
export { MATE, positionKey, search, type SearchResult } from './search';

/** Bots treat repeating a position as slightly worse than a draw, so they keep trying to make progress. */
export const DEFAULT_CONTEMPT = 30;

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  /** Use the node budget only (no wall clock) — for reproducible tests. */
  ignoreTime?: boolean;
  /** Earlier positions of the game (positionKey), for repetition avoidance. */
  history?: readonly string[];
}

export interface EngineMove {
  uci: string;
  score: number;
  depth: number;
  nodes: number;
}

const toUci = (m: number) =>
  core.squareName(core.moveFrom(m)) + core.squareName(core.moveTo(m)) + (core.isPromotion(m) ? 'm' : '');

/** Material lead (centipawns) at which a bot switches into conversion mode. */
export const CONVERSION_MARGIN = 500;
/** Extra search depth in conversion mode (endgames have few pieces, so this stays cheap). */
export const CONVERSION_EXTRA_DEPTH = 2;

/**
 * A clearly winning bot (big material lead, or a counting rule already running while it is ahead) plays
 * without noise or blunders and searches deeper: weak personas stay weak in normal play but can still
 * finish a won endgame before the Makruk count runs out.
 */
export function inConversion(fen: string): boolean {
  const pos = core.parseFen(fen);
  const lead = materialBalance(pos.board, pos.turn);
  return lead >= CONVERSION_MARGIN || (pos.countingLimit > 0 && lead > 0);
}

/** Picks a move for a bot level. Returns null when there is no legal move. */
export function chooseMove(fen: string, level: BotLevel | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const rng = options.rng ?? Math.random;
  const now = options.now ?? (() => Date.now());
  const pos = core.parseFen(fen);
  const bot = inConversion(fen)
    ? { ...persona, noise: 0, blunderRate: 0, maxDepth: persona.maxDepth + CONVERSION_EXTRA_DEPTH }
    : persona;

  const legal = core.generateLegalMoves(pos.board, pos.turn);
  if (legal.length === 0) return null;
  if (rng() < bot.blunderRate) {
    const m = legal[Math.floor(rng() * legal.length)]!;
    return { uci: toUci(m), score: 0, depth: 0, nodes: 0 };
  }

  const result = search(pos, {
    maxDepth: bot.maxDepth,
    maxNodes: bot.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + bot.timeMs,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    // Only noisy bots choose among root moves by score; the rest search much deeper without exact scores.
    exactRootScores: bot.noise > 0,
  });

  let pick = result.rootMoves[0]!;
  if (bot.noise > 0 && pick.score < MATE - 100) {
    const noisy = result.rootMoves.map((r) => ({ ...r, noisy: r.score + (rng() * 2 - 1) * bot.noise }));
    noisy.sort((a, b) => b.noisy - a.noisy);
    pick = noisy[0]!;
  }
  return { uci: toUci(pick.move), score: pick.score, depth: result.depth, nodes: result.nodes };
}

/** Strongest move within a budget, for hints. */
export function bestMove(
  fen: string,
  options: { maxDepth?: number; maxNodes?: number; timeMs?: number; now?: () => number; history?: readonly string[] } = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const pos = core.parseFen(fen);
  const result = search(pos, {
    maxDepth: options.maxDepth ?? 4,
    maxNodes: options.maxNodes ?? 300_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: false,
  });
  if (result.move < 0) return null;
  return { uci: toUci(result.move), score: result.score, depth: result.depth, nodes: result.nodes };
}

export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
