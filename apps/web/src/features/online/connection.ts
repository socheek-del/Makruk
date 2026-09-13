import { type ClientMessage, ServerMessage } from '@makruk/protocol';

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface GameConnection {
  send: (message: ClientMessage) => void;
  close: () => void;
}

const PING_INTERVAL_MS = 20_000;
const MAX_BACKOFF_MS = 5_000;

/** Opens the room WebSocket and keeps it open: reconnects with backoff and queues messages meanwhile. */
export function openGameConnection(
  code: string,
  token: string,
  handlers: { onMessage: (message: ServerMessage) => void; onStatus: (status: ConnectionStatus) => void },
): GameConnection {
  let socket: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  const queue: string[] = [];

  const url = () =>
    `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/game/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`;

  const send = (message: ClientMessage) => {
    const data = JSON.stringify(message);
    if (socket?.readyState === WebSocket.OPEN) socket.send(data);
    else if (message.type !== 'ping') queue.push(data);
  };

  const open = () => {
    handlers.onStatus(attempt === 0 ? 'connecting' : 'reconnecting');
    const ws = new WebSocket(url());
    socket = ws;
    ws.onopen = () => {
      attempt = 0;
      handlers.onStatus('open');
      for (const data of queue.splice(0)) ws.send(data);
      pingTimer = setInterval(() => send({ type: 'ping', t: Date.now() }), PING_INTERVAL_MS);
    };
    ws.onmessage = (event) => {
      try {
        const parsed = ServerMessage.safeParse(JSON.parse(String(event.data)));
        if (parsed.success) handlers.onMessage(parsed.data);
      } catch {
        // Ignore malformed frames.
      }
    };
    ws.onclose = () => {
      clearInterval(pingTimer);
      if (socket !== ws) return;
      if (closed) {
        handlers.onStatus('closed');
        return;
      }
      handlers.onStatus('reconnecting');
      retryTimer = setTimeout(open, Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempt++));
    };
  };

  open();

  return {
    send,
    close: () => {
      closed = true;
      clearTimeout(retryTimer);
      clearInterval(pingTimer);
      socket?.close(1000, 'leave');
    },
  };
}
