import { describe, expect, it } from 'vitest';
import { HealthResponse } from './index';

describe('HealthResponse', () => {
  it('accepts a valid payload', () => {
    const payload = { ok: true, service: 'makruk', time: new Date().toISOString() };
    expect(HealthResponse.parse(payload)).toEqual(payload);
  });

  it('accepts any product Worker by name', () => {
    expect(HealthResponse.safeParse({ ok: true, service: 'sittuyin', time: new Date().toISOString() }).success).toBe(true);
  });

  // Each product has its own Worker now (plat-005c, sit-008), so the name is no longer a fixed literal —
  // but a health payload must still say which Worker answered.
  it('rejects a missing or empty service name and a bad timestamp', () => {
    const time = new Date().toISOString();
    expect(HealthResponse.safeParse({ ok: true, service: '', time }).success).toBe(false);
    expect(HealthResponse.safeParse({ ok: true, time }).success).toBe(false);
    expect(HealthResponse.safeParse({ ok: true, service: 'makruk', time: 'yesterday' }).success).toBe(false);
  });
});
