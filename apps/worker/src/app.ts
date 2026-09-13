import type { HealthResponse } from '@makruk/protocol';
import { Hono } from 'hono';

export type Env = {
  ASSETS: Fetcher;
};

export const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'makruk', time: new Date().toISOString() } satisfies HealthResponse),
);

app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));
