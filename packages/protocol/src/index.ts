/**
 * Message schemas shared by the web app and the worker (REST + WebSocket).
 * Schemas only — no game logic lives here.
 */
import { z } from 'zod';

export const HealthResponse = z.object({
  ok: z.literal(true),
  service: z.literal('makruk'),
  time: z.iso.datetime(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
