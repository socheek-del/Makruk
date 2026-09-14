import { useEffect, useState } from 'react';
import type { Identity, IdentitySource } from '../online/identity';

/** The browser's seat token once the server has confirmed or issued it. */
export function useIdentity(source: IdentitySource): { identity: Identity | null; failed: boolean } {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    source
      .ensureIdentity()
      .then((id) => active && setIdentity(id))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [source]);
  return { identity, failed };
}
