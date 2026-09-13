import {
  AccountResponse,
  AuthConfigResponse,
  AuthResponse,
  type CreateGameRequest,
  CreateGameResponse,
  GameHistoryResponse,
  GameRecordResponse,
  type GameSummary,
  type MagicLinkRequest,
  RoomSummary,
  type TestLoginRequest,
} from '@makruk/protocol';

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

export async function fetchAuthConfig(): Promise<AuthConfigResponse> {
  const res = await fetch('/api/auth/config');
  if (!res.ok) throw new Error(`auth config failed: ${res.status}`);
  return AuthConfigResponse.parse(await res.json());
}

export async function testLogin(request: TestLoginRequest): Promise<AuthResponse> {
  const res = await fetch('/api/auth/test-login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`test login failed: ${res.status}`);
  return AuthResponse.parse(await res.json());
}

export async function requestMagicLink(request: MagicLinkRequest): Promise<void> {
  const res = await fetch('/api/auth/magic-link', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`magic link failed: ${res.status}`);
}

export async function fetchAccount(token: string): Promise<AccountResponse | null> {
  const res = await fetch('/api/account', { headers: auth(token) });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`account failed: ${res.status}`);
  return AccountResponse.parse(await res.json());
}

export async function fetchHistory(token: string): Promise<GameSummary[]> {
  const res = await fetch('/api/account/games', { headers: auth(token) });
  if (!res.ok) throw new Error(`history failed: ${res.status}`);
  return GameHistoryResponse.parse(await res.json()).games;
}

export async function fetchGameRecord(id: string, token?: string): Promise<GameRecordResponse | null> {
  const res = await fetch(`/api/games/record/${encodeURIComponent(id)}`, { headers: auth(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`game record failed: ${res.status}`);
  return GameRecordResponse.parse(await res.json());
}
