import type { BoardTheme as BoardColors } from '@chaturanga/board-ui';

/** Sittuyin boards are un-checkered: one board colour, grid lines, and the two promotion diagonals. */
export interface BoardTheme extends BoardColors {
  id: string;
  /** The long diagonals a Ne promotes on; drawn over the grid (apps/sittuyin/docs/design.md). */
  diagonal: string;
}

/** Highlights use the "Daung" palette: brass (last move), peacock (selection), ruby (check). */
export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'lacquer',
    board: '#b1472a',
    line: '#3a1710',
    coordinate: '#f2d9b8',
    diagonal: 'rgba(216, 174, 96, 0.85)',
    lastMove: 'rgba(216, 174, 96, 0.5)',
    selected: 'rgba(15, 111, 134, 0.45)',
    check: 'rgba(255, 90, 80, 0.7)',
    hint: 'rgba(28, 12, 8, 0.4)',
  },
  {
    id: 'thanaka',
    board: '#e8d9b4',
    line: '#94794a',
    coordinate: '#6b5430',
    diagonal: 'rgba(148, 121, 74, 0.9)',
    lastMove: 'rgba(168, 128, 47, 0.45)',
    selected: 'rgba(15, 111, 134, 0.3)',
    check: 'rgba(179, 32, 43, 0.65)',
    hint: 'rgba(60, 48, 28, 0.35)',
  },
  {
    id: 'jade',
    board: '#8fb8a6',
    line: '#2f5b4c',
    coordinate: '#21463a',
    diagonal: 'rgba(168, 128, 47, 0.85)',
    lastMove: 'rgba(168, 128, 47, 0.5)',
    selected: 'rgba(15, 111, 134, 0.4)',
    check: 'rgba(179, 32, 43, 0.7)',
    hint: 'rgba(18, 50, 40, 0.35)',
  },
  {
    id: 'teak-night',
    board: '#241a16',
    line: '#7a5a3c',
    coordinate: '#d8ae60',
    diagonal: 'rgba(216, 174, 96, 0.75)',
    lastMove: 'rgba(216, 174, 96, 0.4)',
    selected: 'rgba(92, 192, 214, 0.4)',
    check: 'rgba(240, 138, 134, 0.8)',
    hint: 'rgba(216, 174, 96, 0.4)',
  },
  {
    id: 'contrast',
    board: '#ffffff',
    line: '#000000',
    coordinate: '#000000',
    diagonal: 'rgba(0, 0, 0, 0.6)',
    lastMove: 'rgba(255, 200, 0, 0.6)',
    selected: 'rgba(0, 102, 255, 0.4)',
    check: 'rgba(220, 0, 0, 0.85)',
    hint: 'rgba(0, 0, 0, 0.5)',
  },
];

export function boardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0]!;
}
