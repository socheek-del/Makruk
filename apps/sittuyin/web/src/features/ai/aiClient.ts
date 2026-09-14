import { createAiClient } from '@chaturanga/game-shell/ui';
import type { AiRequest } from './ai.worker';

export { AiCancelled } from '@chaturanga/game-shell/ui';

const client = createAiClient<AiRequest>(() => new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }));

/** Searches off the main thread so the UI never freezes. Setup placements come from the same call. */
export const requestComputerMove = (fen: string, level: number, history: string[] = []) =>
  client.send({ kind: 'move', fen, level, history });

export const requestHint = (fen: string, history: string[] = []) => client.send({ kind: 'hint', fen, history });

export const cancelAi = (): void => client.cancel();
