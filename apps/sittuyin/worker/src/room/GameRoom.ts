import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { sittuyin } from '@chaturanga/sittuyin';
import { recordGame } from '../games';
import type { Env } from '../env';

/**
 * The Sittuyin game room: the shared room Durable Object playing Sittuyin. Every placement and move is
 * replayed through the Sittuyin engine before it is accepted, and clocks wait for the setup to finish.
 */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = sittuyin;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
