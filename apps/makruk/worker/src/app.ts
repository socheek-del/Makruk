import {
  CreateGameRequest,
  type CreateGameResponse,
  type GuestResponse,
  type HealthResponse,
  type PublicUser,
  RoomCode,
} from '@chaturanga/protocol';
import { type Context, Hono } from 'hono';
import { registerAccountRoutes } from './accounts/routes';
import { newGuest, signToken, verifyToken } from './auth';
import type { Env } from './env';
import { generateRoomCode } from './room/code';

export type { Env } from './env';

type AppContext = Context<{ Bindings: Env }>;

export const app = new Hono<{ Bindings: Env }>();

async function currentUser(c: AppContext): Promise<PublicUser | null> {
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : c.req.query('token');
  return token ? verifyToken(token, c.env.AUTH_SECRET) : null;
}

const room = (c: AppContext, code: string) => c.env.GAME_ROOM.get(c.env.GAME_ROOM.idFromName(code));

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'makruk', time: new Date().toISOString() } satisfies HealthResponse),
);

/** acct-001: issue a signed guest identity. */
app.post('/api/guest', async (c) => {
  const user = newGuest();
  return c.json({ token: await signToken(user, c.env.AUTH_SECRET), user } satisfies GuestResponse);
});

app.get('/api/me', async (c) => {
  const user = await currentUser(c);
  return user ? c.json(user) : c.json({ error: 'unauthorized' }, 401);
});

/** online-002: create a private room and return its share code. */
app.post('/api/games', async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const body = CreateGameRequest.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: 'bad_request' }, 400);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const created = await room(c, code).init({
      code,
      creator: user,
      color: body.data.color,
      timeControl: body.data.timeControl,
      rated: body.data.rated,
    });
    if (created) {
      return c.json({ code } satisfies CreateGameResponse, 201);
    }
  }
  return c.json({ error: 'try_again' }, 503);
});

app.get('/api/games/:code', async (c) => {
  const code = c.req.param('code').toUpperCase();
  if (!RoomCode.safeParse(code).success) return c.json({ error: 'not_found' }, 404);
  const summary = await room(c, code).summary();
  return summary ? c.json(summary) : c.json({ error: 'not_found' }, 404);
});

registerAccountRoutes(app);

app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));

/** online-005: quick-match queue for a time-control pool. */
app.get('/ws/match/:pool', async (c) => {
  if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') return c.text('Expected WebSocket', 426);
  const user = await currentUser(c);
  if (!user) return c.text('Unauthorized', 401);
  const url = new URL(c.req.url);
  url.searchParams.set('pool', decodeURIComponent(c.req.param('pool')));
  const forwarded = new Request(url, c.req.raw);
  forwarded.headers.set('x-makruk-user', JSON.stringify(user));
  return c.env.MATCHMAKER.get(c.env.MATCHMAKER.idFromName('global')).fetch(forwarded);
});

/** WebSocket for a game room. Browsers cannot set headers on WebSockets, so the token is a query param. */
app.get('/ws/game/:code', async (c) => {
  if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') return c.text('Expected WebSocket', 426);
  const user = await currentUser(c);
  if (!user) return c.text('Unauthorized', 401);
  const code = c.req.param('code').toUpperCase();
  if (!RoomCode.safeParse(code).success) return c.text('Not found', 404);
  const forwarded = new Request(c.req.raw);
  forwarded.headers.set('x-makruk-user', JSON.stringify(user));
  return room(c, code).fetch(forwarded);
});
