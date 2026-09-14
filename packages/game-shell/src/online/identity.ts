import { GuestResponse } from '@chaturanga/protocol';

/**
 * Anonymous seat token for online play (acct-001). There are no accounts: the token only lets the
 * server recognise this browser, so a reload or dropped connection returns the player to their seat.
 */
export type Identity = GuestResponse;

export interface IdentitySource {
  /** Returns this browser's saved seat token, or asks the server for a new one. */
  ensureIdentity(): Promise<Identity>;
}

/** A product's seat token, kept under its own storage key so two sites never share one. */
export function createIdentity(storageKey: string): IdentitySource {
  let pending: Promise<Identity> | null = null;
  let verified = false;

  const readStored = (): Identity | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = GuestResponse.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  };

  const store = (identity: Identity | null) => {
    try {
      if (identity) localStorage.setItem(storageKey, JSON.stringify(identity));
      else localStorage.removeItem(storageKey);
    } catch {
      // Private mode: the token lasts for this tab only.
    }
  };

  const issueGuest = async (): Promise<Identity> => {
    const res = await fetch('/api/guest', { method: 'POST' });
    if (!res.ok) throw new Error(`guest identity failed: ${res.status}`);
    const identity = GuestResponse.parse(await res.json());
    store(identity);
    return identity;
  };

  return {
    ensureIdentity() {
      pending ??= (async () => {
        const saved = readStored();
        if (saved && verified) return saved;
        if (saved) {
          const me = await fetch('/api/me', { headers: { authorization: `Bearer ${saved.token}` } });
          if (me.ok) {
            verified = true;
            return saved;
          }
          if (me.status !== 401) throw new Error(`identity check failed: ${me.status}`);
          store(null);
        }
        const fresh = await issueGuest();
        verified = true;
        return fresh;
      })().finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}
