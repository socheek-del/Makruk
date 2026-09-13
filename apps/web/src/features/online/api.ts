import {
  AccountResponse,
  AuthConfigResponse,
  AuthErrorCode,
  AuthResponse,
  type CreateGameRequest,
  CreateGameResponse,
  type ForgotPasswordRequest,
  GameHistoryResponse,
  GameRecordResponse,
  type GameSummary,
  type LoginRequest,
  type RegisterRequest,
  type ResendVerificationRequest,
  type ResetPasswordRequest,
  RoomSummary,
} from '@makruk/protocol';

const auth = (token?: string): HeadersInit => (token ? { authorization: `Bearer ${token}` } : {});

/** An auth request failed with a known reason (shown to the user) or a generic server error. */
export class AuthRequestError extends Error {
  constructor(readonly code: AuthErrorCode | 'server') {
    super(code);
    this.name = 'AuthRequestError';
  }
}

async function postJson(path: string, body: unknown): Promise<Response> {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (res.ok) return res;
  const parsed = AuthErrorCode.safeParse(((await res.json().catch(() => ({}))) as { error?: unknown }).error);
  throw new AuthRequestError(parsed.success ? parsed.data : 'server');
}

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

export async function register(request: RegisterRequest): Promise<void> {
  await postJson('/api/auth/register', request);
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  return AuthResponse.parse(await (await postJson('/api/auth/login', request)).json());
}

export async function resendVerification(request: ResendVerificationRequest): Promise<void> {
  await postJson('/api/auth/resend-verification', request);
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
  await postJson('/api/auth/forgot-password', request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<AuthResponse> {
  return AuthResponse.parse(await (await postJson('/api/auth/reset-password', request)).json());
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
