/// <reference lib="webworker" />
import { bestMove, chooseMove } from '@makruk/ai';

export type AiRequest =
  | { id: number; kind: 'move'; fen: string; level: number; history: string[] }
  | { id: number; kind: 'hint'; fen: string; history: string[] };

export interface AiResponse {
  id: number;
  uci: string | null;
  score: number;
  depth: number;
  nodes: number;
  elapsedMs: number;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AiRequest>) => void) | null;
  postMessage: (message: AiResponse) => void;
};

scope.onmessage = (event) => {
  const request = event.data;
  const started = performance.now();
  const move =
    request.kind === 'move'
      ? chooseMove(request.fen, request.level, { history: request.history })
      : bestMove(request.fen, { maxDepth: 5, maxNodes: 400_000, timeMs: 1_500, history: request.history });
  scope.postMessage({
    id: request.id,
    uci: move?.uci ?? null,
    score: move?.score ?? 0,
    depth: move?.depth ?? 0,
    nodes: move?.nodes ?? 0,
    elapsedMs: performance.now() - started,
  });
};
