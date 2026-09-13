import { type Color, Game, IllegalMoveError, START_FEN } from '@makruk/engine';
import type { ClockState } from '@makruk/engine/clock';
import type { ClientMessage, GameSnapshot, ServerMessage } from '@makruk/protocol';
import { create } from 'zustand';
import type { ConnectionStatus } from '../features/online/connection';
import type { GameSessionState } from './localSession';

export interface OnlineSessionState extends GameSessionState {
  snapshot: GameSnapshot | null;
  /** Local time the latest snapshot arrived (pairs with snapshot.serverTime for countdowns). */
  receivedAt: number;
  you: Color | null;
  connection: ConnectionStatus;
  lastError: string | null;
  send: (message: ClientMessage) => void;
  receive: (message: ServerMessage, receivedAt?: number) => void;
  setConnection: (status: ConnectionStatus) => void;
  bindSender: (send: (message: ClientMessage) => void) => void;
}

/** Server clock values are "remaining at serverTime"; we count down locally from the moment they arrive. */
export function clockFromSnapshot(snapshot: GameSnapshot, receivedAt: number): ClockState | null {
  if (!snapshot.clock) return null;
  const { w, b, running } = snapshot.clock;
  return { remaining: { w, b }, running, since: running ? receivedAt : null };
}

/**
 * Adapts the server-authoritative room to the same session interface the local game screen uses.
 * Moves are applied optimistically and replaced by the next server snapshot.
 */
export function createOnlineSession() {
  let sender: (message: ClientMessage) => void = () => {};

  return create<OnlineSessionState>((set, get) => ({
    phase: 'playing',
    game: new Game(),
    startFen: START_FEN,
    version: 0,
    timeControl: null,
    clock: null,
    result: null,
    viewPly: null,
    flipped: false,
    snapshot: null,
    receivedAt: 0,
    you: null,
    connection: 'connecting',
    lastError: null,

    bindSender: (send) => {
      sender = send;
    },
    send: (message) => sender(message),

    receive: (message, receivedAt = Date.now()) => {
      if (message.type === 'error') {
        set({ lastError: message.code });
        return;
      }
      if (message.type !== 'state') return;
      const snapshot = message.game;
      const game = new Game(snapshot.startFen);
      for (const move of snapshot.moves) game.move(move);
      set((s) => ({
        snapshot,
        receivedAt,
        you: message.you,
        game,
        startFen: snapshot.startFen,
        timeControl: snapshot.timeControl,
        clock: clockFromSnapshot(snapshot, receivedAt),
        result: snapshot.result,
        lastError: null,
        viewPly: s.viewPly !== null && s.viewPly >= snapshot.moves.length ? null : s.viewPly,
        version: s.version + 1,
      }));
    },

    setConnection: (connection) => set({ connection }),

    move: (move) => {
      const { game, you, result, viewPly, snapshot } = get();
      if (!snapshot || snapshot.status !== 'playing' || result || viewPly !== null || game.turn !== you) return null;
      try {
        const record = game.move(move);
        sender({ type: 'move', uci: record.uci, ply: game.moves().length - 1 });
        set((s) => ({ version: s.version + 1 }));
        return record;
      } catch (err) {
        if (err instanceof IllegalMoveError) return null;
        throw err;
      }
    },

    resign: () => sender({ type: 'resign' }),
    setViewPly: (ply) => {
      const total = get().game.moves().length;
      set({ viewPly: ply === null || ply >= total ? null : Math.max(0, ply) });
    },
    flip: () => set((s) => ({ flipped: !s.flipped })),

    // Local-only actions that have no meaning online (the page replaces exitToSetup with navigation).
    start: () => {},
    undo: () => {},
    tick: () => {},
    exitToSetup: () => {},
  }));
}
