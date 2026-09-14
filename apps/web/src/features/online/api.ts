import { type CreateGameRequest, CreateGameResponse, RoomSummary } from '@makruk/protocol';

const auth = (token?: string): HeadersInit => (token ? { authorization: `Bearer ${token}` } : {});

export async function createRoom(token: string, request: Partial<CreateGameRequest> & Pick<CreateGameRequest, 'timeControl' | 'color'>): Promise<string> {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`create room failed: ${res.status}`);
  return CreateGameResponse.parse(await res.json()).code;
}

export async function fetchRoom(code: string): Promise<RoomSummary | null> {
  const res = await fetch(`/api/games/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`room lookup failed: ${res.status}`);
  return RoomSummary.parse(await res.json());
}
