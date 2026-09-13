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

export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'teak',
    board: '#e6b877',
    line: '#8a5a2b',
    coordinate: '#6b4119',
    lastMove: 'rgba(255, 214, 10, 0.45)',
    selected: 'rgba(28, 176, 246, 0.35)',
    check: 'rgba(255, 75, 75, 0.75)',
    hint: 'rgba(59, 42, 26, 0.35)',
  },
  {
    id: 'jade',
    board: '#a8d8b9',
    line: '#2f6b4f',
    coordinate: '#245a41',
    lastMove: 'rgba(255, 214, 10, 0.5)',
    selected: 'rgba(28, 176, 246, 0.35)',
    check: 'rgba(255, 75, 75, 0.75)',
    hint: 'rgba(20, 60, 40, 0.35)',
  },
  {
    id: 'lacquer',
    board: '#4a1f1a',
    line: '#d4a24c',
    coordinate: '#e8c27a',
    lastMove: 'rgba(212, 162, 76, 0.45)',
    selected: 'rgba(73, 192, 248, 0.4)',
    check: 'rgba(255, 75, 75, 0.8)',
    hint: 'rgba(232, 194, 122, 0.45)',
  },
  {
    id: 'night',
    board: '#1f2d4f',
    line: '#49c0f8',
    coordinate: '#8fd8fb',
    lastMove: 'rgba(147, 211, 51, 0.4)',
    selected: 'rgba(255, 150, 0, 0.4)',
    check: 'rgba(255, 75, 75, 0.8)',
    hint: 'rgba(143, 216, 251, 0.45)',
  },
  {
    id: 'minimal',
    board: '#f3efe6',
    line: '#b9b0a0',
    coordinate: '#8a8170',
    lastMove: 'rgba(255, 200, 0, 0.4)',
    selected: 'rgba(28, 176, 246, 0.3)',
    check: 'rgba(255, 75, 75, 0.7)',
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
