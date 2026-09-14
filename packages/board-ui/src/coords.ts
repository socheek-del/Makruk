import type { Square } from '@chaturanga/rules-core';

const FILE_LETTERS = 'abcdefghijklmnop';

/** Square index (rank * files + file, a1 = 0) to its name, e.g. `e4` or `i10`. */
export function squareNameOf(square: Square, files: number): string {
  return FILE_LETTERS[square % files]! + String(Math.floor(square / files) + 1);
}

/** Square name to index, or null when it is not a square name. */
export function squareOf(name: string, files: number): Square | null {
  const match = /^([a-p])(\d{1,2})$/.exec(name);
  if (!match) return null;
  return (Number(match[2]) - 1) * files + (match[1]!.charCodeAt(0) - 97);
}

export type ParsedMove =
  /** `R@a1`: a piece placed from hand (type in lower case). */
  | { kind: 'drop'; type: string; to: Square; uci: string }
  /** `e3e4`, promotion with a suffix letter (`a5a6m`, `h5g4f`), in place when from equals to (`e5e5f`). */
  | { kind: 'move'; from: Square; to: Square; promotion: boolean; uci: string };

/** Parses an engine move in Fairy-Stockfish coordinate notation. */
export function parseUci(uci: string, files: number): ParsedMove | null {
  const drop = /^([A-Z])@([a-p]\d{1,2})$/.exec(uci);
  if (drop) {
    const to = squareOf(drop[2]!, files);
    return to === null ? null : { kind: 'drop', type: drop[1]!.toLowerCase(), to, uci };
  }
  const move = /^([a-p]\d{1,2})([a-p]\d{1,2})([a-z]?)$/.exec(uci);
  if (!move) return null;
  const from = squareOf(move[1]!, files);
  const to = squareOf(move[2]!, files);
  if (from === null || to === null) return null;
  return { kind: 'move', from, to, promotion: move[3] !== '', uci };
}
