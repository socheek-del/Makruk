import { HealthResponse } from '@makruk/protocol';
import { describe, expect, it } from 'vitest';
import { app } from './app';

describe('worker API', () => {
  it('GET /api/health returns a valid health payload', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(HealthResponse.safeParse(await res.json()).success).toBe(true);
  });

  it('unknown API routes return 404 JSON', async () => {
    const res = await app.request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});
