import { type MatchServerMessage, type PublicUser, QUICK_POOLS, QuickPool } from '@chaturanga/protocol';
import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../env';
import { generateRoomCode } from '../room/code';

interface Seeker {
  user: PublicUser;
  pool: QuickPool;
  joinedAt: number;
}

/**
 * online-005: a single Durable Object that pairs players per time-control pool. The queue is simply
 * the set of open (hibernatable) sockets tagged with the pool, so cancelling a search is closing it.
 */
export class Matchmaker extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
    const header = request.headers.get('x-makruk-user');
    if (!header) return new Response('Unauthorized', { status: 401 });
    const user = JSON.parse(header) as PublicUser;
    const pool = QuickPool.safeParse(new URL(request.url).searchParams.get('pool'));

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    if (!pool.success) {
      server.accept();
      this.send(server, { type: 'error', code: 'bad_pool' });
      server.close(1008, 'bad pool');
      return new Response(null, { status: 101, webSocket: client });
    }

    this.ctx.acceptWebSocket(server, [pool.data]);
    server.serializeAttachment({ user, pool: pool.data, joinedAt: Date.now() } satisfies Seeker);

    const opponent = this.ctx
      .getWebSockets(pool.data)
      .filter((ws) => ws !== server && ws.readyState === WebSocket.OPEN)
      .map((ws) => ({ ws, seeker: ws.deserializeAttachment() as Seeker }))
      .filter(({ seeker }) => seeker.user.id !== user.id)
      .sort((a, b) => a.seeker.joinedAt - b.seeker.joinedAt)[0];

    if (!opponent) {
      this.send(server, { type: 'queued', pool: pool.data });
    } else {
      const code = await this.createRoom(opponent.seeker.user, user, pool.data);
      for (const ws of [opponent.ws, server]) {
        this.send(ws, code ? { type: 'matched', code } : { type: 'error', code: 'unavailable' });
        ws.close(1000, code ? 'matched' : 'unavailable');
      }
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    // Leaving the queue needs no bookkeeping: closed sockets drop out of getWebSockets().
    try {
      ws.close(code, reason);
    } catch {
      // Already closed.
    }
  }

  private async createRoom(first: PublicUser, second: PublicUser, pool: QuickPool): Promise<string | null> {
    const color = Math.random() < 0.5 ? 'w' : 'b';
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      const room = this.env.GAME_ROOM.get(this.env.GAME_ROOM.idFromName(code));
      if (await room.init({ code, creator: first, color, timeControl: QUICK_POOLS[pool], opponent: second, rated: true })) return code;
    }
    return null;
  }

  private send(ws: WebSocket, message: MatchServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // Socket closing.
    }
  }
}
