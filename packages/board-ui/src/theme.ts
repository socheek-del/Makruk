/** Colours the board and hand trays paint with. Each product defines its own themes. */
export interface BoardTheme {
  board: string;
  line: string;
  coordinate: string;
  selected: string;
  lastMove: string;
  check: string;
  /** Legal-target dots and rings, and promotion markers. */
  hint: string;
}
