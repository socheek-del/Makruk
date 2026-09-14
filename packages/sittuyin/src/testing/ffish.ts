/**
 * Test-only loader for ffish (Fairy-Stockfish compiled to WASM), the rules reference.
 * Not exported from the package; never bundled into the app.
 */
import { createRequire } from 'node:module';

export interface FfishBoard {
  legalMoves(): string;
  push(uci: string): boolean;
  pop(): void;
  fen(): string;
  sanMove(uci: string): string;
  isGameOver(claimDraw?: boolean): boolean;
  result(claimDraw?: boolean): string;
  delete(): void;
}

export interface Ffish {
  Board: new (variant: string, fen?: string) => FfishBoard;
}

let loading: Promise<Ffish> | undefined;

export function loadFfish(): Promise<Ffish> {
  loading ??= new Promise((resolve) => {
    // ffish's Emscripten loader tries fetch() on a file path when fetch exists (Node 18+).
    const g = globalThis as { fetch?: unknown };
    const savedFetch = g.fetch;
    g.fetch = undefined;
    const require = createRequire(import.meta.url);
    const mod = require('ffish') as Ffish & { onRuntimeInitialized?: () => void };
    mod.onRuntimeInitialized = () => {
      g.fetch = savedFetch;
      resolve(mod);
    };
  });
  return loading;
}

/** Fairy-Stockfish does not mark promoted pieces in FEN; strip our `~` marker before comparing. */
export const normalizeFen = (fen: string): string => fen.replace(/~/g, '');

/** Deterministic PRNG so reference games are reproducible from their seed. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
