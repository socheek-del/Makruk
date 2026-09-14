/** Makruk boards are un-checkered: one board colour, grid lines between squares. */
export interface BoardTheme {
  id: string;
  board: string;
  line: string;
  coordinate: string;
  lastMove: string;
  selected: string;
  check: string;
  hint: string;
}

/** Highlights use the "Wat" palette: temple gold (last move), indigo or jade (selection), lacquer red (check). */
export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'teak',
    board: '#e6b877',
    line: '#8a5a2b',
    coordinate: '#6b4119',
    lastMove: 'rgba(224, 169, 59, 0.5)',
    selected: 'rgba(58, 63, 155, 0.3)',
    check: 'rgba(182, 58, 43, 0.7)',
    hint: 'rgba(59, 42, 26, 0.35)',
  },
  {
    id: 'jade',
    board: '#a8d8b9',
    line: '#2f6b4f',
    coordinate: '#245a41',
    lastMove: 'rgba(224, 169, 59, 0.55)',
    selected: 'rgba(58, 63, 155, 0.3)',
    check: 'rgba(182, 58, 43, 0.7)',
    hint: 'rgba(20, 60, 40, 0.35)',
  },
  {
    id: 'lacquer',
    board: '#4a1f1a',
    line: '#d4a24c',
    coordinate: '#e8c27a',
    lastMove: 'rgba(212, 162, 76, 0.45)',
    selected: 'rgba(158, 164, 244, 0.4)',
    check: 'rgba(240, 138, 122, 0.8)',
    hint: 'rgba(232, 194, 122, 0.45)',
  },
  {
    id: 'night',
    board: '#1f2d4f',
    line: '#7c83e6',
    coordinate: '#b9bdf7',
    lastMove: 'rgba(226, 182, 90, 0.4)',
    selected: 'rgba(79, 194, 159, 0.4)',
    check: 'rgba(240, 138, 122, 0.8)',
    hint: 'rgba(185, 189, 247, 0.45)',
  },
  {
    id: 'minimal',
    board: '#f3efe6',
    line: '#b9b0a0',
    coordinate: '#8a8170',
    lastMove: 'rgba(224, 169, 59, 0.4)',
    selected: 'rgba(58, 63, 155, 0.25)',
    check: 'rgba(182, 58, 43, 0.65)',
    hint: 'rgba(60, 60, 60, 0.28)',
  },
  {
    id: 'contrast',
    board: '#ffffff',
    line: '#000000',
    coordinate: '#000000',
    lastMove: 'rgba(255, 200, 0, 0.6)',
    selected: 'rgba(0, 102, 255, 0.4)',
    check: 'rgba(220, 0, 0, 0.85)',
    hint: 'rgba(0, 0, 0, 0.5)',
  },
];

export function boardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0]!;
}
