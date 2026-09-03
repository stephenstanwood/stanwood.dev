import { useEffect, useState } from "react";

/**
 * Runs an async loader once on mount and holds the list it resolves to.
 *
 * `ready` stays false until the loader settles, and a resolve that lands after
 * unmount is dropped. A loader that rejects leaves `ready` false forever — the
 * sports rails render nothing until they have real data, so a failed fetch and
 * an unfinished one look the same to the caller.
 */
export function useAsyncList<T>(load: () => Promise<T[]>): { items: T[]; ready: boolean } {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    load().then((next) => {
      if (cancelled) return;
      setItems(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // `load` is a fresh closure on every render at every call site, so keying the
    // effect on it would reload forever. Mount-only is the intended lifetime.
  }, []);

  return { items, ready };
}
