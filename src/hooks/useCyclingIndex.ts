import { useState, useEffect } from "react";

/**
 * Advances an index through `[0, length)` every `intervalMs`, wrapping at the end.
 * The index resets to 0 whenever `resetKey` changes, so a caller that swaps the
 * backing list can restart the rotation without its own effect.
 *
 * Unlike `useCycling`, this returns only the index — for callers that pick the
 * item themselves or drive positional UI (slots, dots) off the number.
 *
 * @param length - Number of items to cycle through; <= 1 holds the index at 0
 * @param intervalMs - Time between advances
 * @param enabled - Set false to freeze the index (e.g. while not loading)
 * @param resetKey - Changing this snaps the index back to 0
 */
export function useCyclingIndex(
  length: number,
  intervalMs: number,
  { enabled = true, resetKey }: { enabled?: boolean; resetKey?: unknown } = {},
): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [resetKey]);

  useEffect(() => {
    if (!enabled || length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [enabled, length, intervalMs, resetKey]);

  // Clamp so a shrinking list can't hand callers an out-of-range index on the
  // render between the list swapping and the reset effect firing.
  return length > 0 ? Math.min(index, length - 1) : 0;
}
