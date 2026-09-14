import { makruk } from '@chaturanga/makruk';
import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { recordGame } from '../accounts/store';
import type { Env } from '../env';

export type { InitOptions } from '@chaturanga/server-kit';

/** The Makruk game room: the shared room Durable Object playing Makruk and storing games in this product's D1. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = makruk;

  /** acct-003: store the finished game (and rating changes) in D1. */
  protected override async onFinished(room: RoomState): Promise<void> {
    const { w: white, b: black } = room.players;
    if (!white || !black || !room.result) return;
    await recordGame(this.env.DB, {
      id: `${room.code}-${room.createdAt}`,
      code: room.code,
      variant: room.variant,
      white,
      black,
      startFen: room.startFen,
      moves: room.moves,
      timeControl: room.timeControl,
      result: room.result,
      rated: room.rated,
      finishedAt: Date.now(),
    });
  }
}
