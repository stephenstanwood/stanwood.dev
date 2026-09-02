import { useEffect, useState } from "react";

/**
 * Fetches a JSON endpoint once on mount — the pattern every homepage tile uses
 * to hydrate itself from its own `/api/*` route.
 *
 * `data` stays null until the response lands. `failed` flips true when the
 * request or the JSON parse throws; a tile that has no error state can simply
 * ignore it and keep rendering its loading view.
 */
export function useJsonOnMount<T>(url: string, init?: RequestInit): {
  data: T | null;
  failed: boolean;
} {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(url, init)
      .then((res) => res.json())
      .then((json: T) => {
        if (active) setData(json);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
    // `init` is a fresh object literal on every render at every call site, so
    // keying the effect on it would refetch forever. The URL is the identity.
  }, [url]);

  return { data, failed };
}
