/**
 * Identity tokens: HMAC-SHA256 signed payloads carrying the public user (guest or signed-in account).
 * The same signing is used for short-lived OAuth state.
 */
import { PublicUser } from '@chaturanga/protocol';

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signPayload(payload: unknown, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(signature)}`;
}

export async function verifyPayload(token: string, secret: string): Promise<unknown | null> {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromBase64Url(signature), encoder.encode(body));
    return valid ? JSON.parse(new TextDecoder().decode(fromBase64Url(body))) : null;
  } catch {
    return null;
  }
}

export async function signToken(user: PublicUser, secret: string, now = Date.now()): Promise<string> {
  return signPayload({ ...user, iat: now }, secret);
}

export async function verifyToken(token: string, secret: string): Promise<PublicUser | null> {
  const parsed = PublicUser.safeParse(await verifyPayload(token, secret));
  return parsed.success ? parsed.data : null;
}

export function newGuest(): PublicUser {
  const random = crypto.getRandomValues(new Uint32Array(1))[0]!;
  return { id: `g_${crypto.randomUUID()}`, name: String(1000 + (random % 9000)), kind: 'guest' };
}
