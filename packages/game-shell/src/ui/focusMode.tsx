import { createContext, type ReactNode, useContext, useLayoutEffect, useMemo, useState } from 'react';

/**
 * Focus mode (polish-003): while a game or a lesson is on screen, a product's app shell can give it the
 * whole phone screen — no bottom nav, a back control instead. Screens announce themselves with
 * `useFocusMode`; the shell reads `useFocusModeProvider` and decides what to hide.
 */
export type FocusKind = 'game' | 'lesson';

interface FocusApi {
  /** Enters focus mode; the returned function leaves it. */
  enter: (kind: FocusKind) => () => void;
}

const FocusContext = createContext<FocusApi | null>(null);

/** Marks the calling screen as a focus screen while it is mounted. Does nothing without a provider. */
export function useFocusMode(kind: FocusKind): void {
  const api = useContext(FocusContext);
  // Before paint, so the nav bar never flashes in and out when a game or lesson opens.
  useLayoutEffect(() => api?.enter(kind), [api, kind]);
}

/** For an app shell: the current focus kind (null when none) and a provider to wrap the routes in. */
export function useFocusModeProvider(): { focus: FocusKind | null; FocusProvider: (props: { children: ReactNode }) => ReactNode } {
  const [stack, setStack] = useState<{ id: number; kind: FocusKind }[]>([]);
  const api = useMemo<FocusApi>(() => {
    let next = 0;
    return {
      enter: (kind) => {
        const id = next++;
        setStack((s) => [...s, { id, kind }]);
        return () => setStack((s) => s.filter((entry) => entry.id !== id));
      },
    };
  }, []);
  const FocusProvider = useMemo(
    () =>
      function FocusProvider({ children }: { children: ReactNode }) {
        return <FocusContext.Provider value={api}>{children}</FocusContext.Provider>;
      },
    [api],
  );
  return { focus: stack.at(-1)?.kind ?? null, FocusProvider };
}
