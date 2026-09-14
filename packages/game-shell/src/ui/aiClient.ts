/**
 * Talks to a game's bot Web Worker. The search runs off the main thread so the UI never freezes.
 *
 * The worker itself belongs to the product — each game has its own engine — so it is injected. Vite
 * needs `new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })` to appear literally
 * in the app, which is the other reason this takes a factory rather than a path.
 */

export class AiCancelled extends Error {
  constructor() {
    super('AI request cancelled');
    this.name = 'AiCancelled';
  }
}

/** What every bot worker answers with. `uci` is null when there is no legal move. */
export interface AiResponse {
  id: number;
  uci: string | null;
  score: number;
  depth: number;
  nodes: number;
  elapsedMs: number;
}

interface Pending {
  resolve: (response: AiResponse) => void;
  reject: (error: Error) => void;
}

/** Distributes over a union of request kinds; a plain Omit would collapse them into their shared keys. */
type WithoutId<R> = R extends unknown ? Omit<R, 'id'> : never;

export interface AiClient<Request extends { id: number }> {
  /** Sends a request and resolves with the worker's answer. The id is added here. */
  send(body: WithoutId<Request>): Promise<AiResponse>;
  /** Stops any running search immediately (new game, takeback, leaving the page). */
  cancel(): void;
}

export function createAiClient<Request extends { id: number }>(spawn: () => Worker): AiClient<Request> {
  let worker: Worker | null = null;
  let nextId = 1;
  const pending = new Map<number, Pending>();

  const rejectAll = (error: Error) => {
    for (const p of pending.values()) p.reject(error);
    pending.clear();
  };

  const get = (): Worker => {
    if (worker) return worker;
    worker = spawn();
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
  };

  return {
    send(body) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        get().postMessage({ ...body, id } as unknown as Request);
      });
    },
    cancel() {
      if (!worker) return;
      worker.terminate();
      worker = null;
      rejectAll(new AiCancelled());
    },
  };
}
