/** Password hashing with PBKDF2-SHA256 (Web Crypto, available in Workers). */

const encoder = new TextEncoder();
/** Workers cap PBKDF2 at 100k iterations. */
const ITERATIONS = 100_000;
const SCHEME = 'pbkdf2-sha256';

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** Returns `pbkdf2-sha256$iterations$salt$hash`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${SCHEME}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split('$');
  if (scheme !== SCHEME || !iterations || !salt || !hash) return false;
  const expected = fromBase64(hash);
  const actual = await derive(password, fromBase64(salt), Number(iterations));
  return expected.length === actual.length && crypto.subtle.timingSafeEqual(expected, actual);
}

/** Hash of a random password, used to spend the same time when the account does not exist. */
export const DUMMY_HASH = `${SCHEME}$${ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;
