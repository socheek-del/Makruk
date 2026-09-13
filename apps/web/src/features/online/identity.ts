import { GuestResponse, type PublicUser } from '@makruk/protocol';
import type { TFunction } from 'i18next';
import { useEffect, useState } from 'react';

export type Identity = GuestResponse;

const STORAGE_KEY = 'makruk.identity';

function readStored(): Identity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = GuestResponse.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function store(identity: Identity | null) {
  try {
    if (identity) localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode: identity lasts for this tab only.
  }
}

async function issueGuest(): Promise<Identity> {
  const res = await fetch('/api/guest', { method: 'POST' });
  if (!res.ok) throw new Error(`guest identity failed: ${res.status}`);
  const identity = GuestResponse.parse(await res.json());
  store(identity);
  return identity;
}

let pending: Promise<Identity> | null = null;
let verified = false;

/** acct-001: returns the saved guest identity, or asks the server for a new one. */
export function ensureIdentity(): Promise<Identity> {
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
}

export function useIdentity(): { identity: Identity | null; failed: boolean } {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    ensureIdentity()
      .then((id) => active && setIdentity(id))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);
  return { identity, failed };
}

export function displayName(user: PublicUser | null | undefined, t: TFunction): string {
  if (!user) return '—';
  return user.kind === 'guest' ? t('online.guestName', { tag: user.name }) : user.name;
}
