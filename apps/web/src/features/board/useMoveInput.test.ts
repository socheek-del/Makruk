import { Game, type Move, parseSquare as sq } from '@makruk/engine';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMoveInput } from './useMoveInput';

function setup(canMove = true) {
  const game = new Game();
  const onMove = vi.fn((move: Move) => {
    game.move(move);
    version++;
  });
  let version = 0;
  const hook = renderHook(() => useMoveInput({ game, version, canMove, onMove }));
  return { game, onMove, hook, bump: () => hook.rerender() };
}

describe('useMoveInput', () => {
  it('selecting a movable piece shows its legal targets', () => {
    const { hook } = setup();
    act(() => hook.result.current.onSquareClick(sq('e3')));
    expect(hook.result.current.selected).toBe(sq('e3'));
    expect(hook.result.current.targets).toEqual([sq('e4')]);
  });

  it('tapping a legal target plays the move', () => {
    const { hook, onMove } = setup();
    act(() => hook.result.current.onSquareClick(sq('b1')));
    act(() => hook.result.current.onSquareClick(sq('d2')));
    expect(onMove).toHaveBeenCalledWith({ from: sq('b1'), to: sq('d2'), promotion: false });
  });

  it('tapping an illegal square keeps the move unplayed and clears or switches selection', () => {
    const { hook, onMove } = setup();
    act(() => hook.result.current.onSquareClick(sq('e3')));
    act(() => hook.result.current.onSquareClick(sq('e5')));
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.selected).toBeNull();
    act(() => hook.result.current.onSquareClick(sq('e3')));
    act(() => hook.result.current.onSquareClick(sq('d3')));
    expect(hook.result.current.selected).toBe(sq('d3'));
  });

  it('opponent pieces and empty squares cannot be selected', () => {
    const { hook } = setup();
    act(() => hook.result.current.onSquareClick(sq('e6')));
    expect(hook.result.current.selected).toBeNull();
    act(() => hook.result.current.onSquareClick(sq('e4')));
    expect(hook.result.current.selected).toBeNull();
  });

  it('drop only accepts legal moves', () => {
    const { hook, onMove } = setup();
    let ok = false;
    act(() => {
      ok = hook.result.current.onDrop(sq('g1'), sq('g3'));
    });
    expect(ok).toBe(false);
    act(() => {
      ok = hook.result.current.onDrop(sq('g1'), sq('e2'));
    });
    expect(ok).toBe(true);
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('does nothing when input is disabled', () => {
    const { hook } = setup(false);
    act(() => hook.result.current.onSquareClick(sq('e3')));
    expect(hook.result.current.selected).toBeNull();
    expect(hook.result.current.canDrag(sq('e3'))).toBe(false);
  });
});
