/**
 * Message schemas shared by the web app and the worker (REST + WebSocket).
 * Schemas only — no game logic lives here.
 */
import { z } from 'zod';

export * from './accounts';
export * from './game';

export const HealthResponse = z.object({
  ok: z.literal(true),
  /** The product's Worker, e.g. 'makruk' or 'sittuyin'. */
  service: z.string().min(1),
  time: z.iso.datetime(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
