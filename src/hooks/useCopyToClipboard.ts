import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copies text to the clipboard and exposes a short-lived `copied` flag that
 * flips back to false after `resetMs` (default 2000ms) — the "Copied!" /
 * "share → copied!" confirmation pattern used across the site.
 *
 * Returns the flag plus a `copy(text)` callback. Each button needs its own
 * hook instance (e.g. separate link/text copy buttons in one component).
 *
 * @param resetMs - How long the confirmation stays visible, in ms.
 */
export function useCopyToClipboard(resetMs = 2000): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetMs);
      } catch {
        // clipboard API unavailable — leave state untouched
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
