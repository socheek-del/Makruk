/**
 * Guest identity: a signed token (HMAC-SHA256) carrying the public user. No database needed for
 * guests; signed-in accounts (acct-002) reuse the same token format with kind "user".
 */
import { PublicUser } from '@makruk/protocol';

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

export async function signToken(user: PublicUser, secret: string, now = Date.now()): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ ...user, iat: now })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifyToken(token: string, secret: string): Promise<PublicUser | null> {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return null;
    const parsed = PublicUser.safeParse(JSON.parse(new TextDecoder().decode(fromBase64Url(payload))));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function newGuest(): PublicUser {
  const random = crypto.getRandomValues(new Uint32Array(1))[0]!;
  return { id: `g_${crypto.randomUUID()}`, name: String(1000 + (random % 9000)), kind: 'guest' };
}
