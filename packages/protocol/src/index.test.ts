import { describe, expect, it } from 'vitest';
import { HealthResponse } from './index';

describe('HealthResponse', () => {
  it('accepts a valid payload', () => {
    const payload = { ok: true, service: 'makruk', time: new Date().toISOString() };
    expect(HealthResponse.parse(payload)).toEqual(payload);
  });

  it('rejects a wrong service name', () => {
    expect(HealthResponse.safeParse({ ok: true, service: 'other', time: new Date().toISOString() }).success).toBe(
      false,
    );
  });
});
