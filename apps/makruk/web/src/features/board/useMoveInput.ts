import type { Game, Move, Square } from '@chaturanga/makruk';
import { useMemo, useState } from 'react';

export interface MoveInputOptions {
  game: Game;
  /** Store version; selection resets whenever the position changes. */
  version: number;
  /** False while it is not this user's turn or the game is over. */
  canMove: boolean;
  onMove: (move: Move) => void;
}

export interface MoveInput {
  selected: Square | null;
  targets: Square[];
  canDrag: (square: Square) => boolean;
  onSquareClick: (square: Square) => void;
  /** Returns true if from→to was a legal move and was played. */
  onDrop: (from: Square, to: Square) => boolean;
}

/** Tap-tap and drag-and-drop move entry backed by the engine's legal move list. */
export function useMoveInput({ game, version, canMove, onMove }: MoveInputOptions): MoveInput {
  const [selection, setSelection] = useState<{ version: number; square: Square } | null>(null);
  const legal = useMemo(() => (canMove ? game.legalMoves() : []), [game, version, canMove]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = selection && selection.version === version ? selection.square : null;
  const targets = selected === null ? [] : legal.filter((m) => m.from === selected).map((m) => m.to);
  const canDrag = (square: Square) => legal.some((m) => m.from === square);

  const play = (from: Square, to: Square): boolean => {
    const move = legal.find((m) => m.from === from && m.to === to);
    if (!move) return false;
    setSelection(null);
    onMove(move);
    return true;
  };

  const onSquareClick = (square: Square) => {
    if (!canMove) return;
    if (selected !== null) {
      if (square === selected) return setSelection(null);
      if (play(selected, square)) return;
    }
    setSelection(canDrag(square) ? { version, square } : null);
  };

  return { selected, targets, canDrag, onSquareClick, onDrop: play };
}
