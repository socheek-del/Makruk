import type { AiRequest, AiResponse } from './ai.worker';

export class AiCancelled extends Error {
  constructor() {
    super('AI request cancelled');
    this.name = 'AiCancelled';
  }
}

interface Pending {
  resolve: (response: AiResponse) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function rejectAll(error: Error) {
  for (const p of pending.values()) p.reject(error);
  pending.clear();
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<AiResponse>) => {
    const p = pending.get(event.data.id);
    pending.delete(event.data.id);
    p?.resolve(event.data);
  };
  worker.onerror = (event) => {
    rejectAll(new Error(event.message || 'AI worker failed'));
    worker?.terminate();
    worker = null;
  };
  return worker;
}

type RequestBody = AiRequest extends infer R ? (R extends AiRequest ? Omit<R, 'id'> : never) : never;

function send(body: RequestBody): Promise<AiResponse> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...body, id } as AiRequest);
  });
}

/** Searches off the main thread so the UI never freezes. */
export const requestComputerMove = (fen: string, level: number) => send({ kind: 'move', fen, level });

export const requestHint = (fen: string) => send({ kind: 'hint', fen });

/** Stops any running search immediately (new game, takeback, leaving the page). */
export function cancelAi(): void {
  if (!worker) return;
  worker.terminate();
  worker = null;
  rejectAll(new AiCancelled());
}
