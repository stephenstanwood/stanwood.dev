import { useState, useEffect } from "react";

/**
 * Cycles through items with a fade-in/out transition.
 * Returns the current item value and a boolean `fading` flag.
 *
 * @param items - Array of items to cycle through
 * @param interval - Time in ms between transitions
 * @param fadeDuration - Fade-out duration in ms (item swaps at this point)
 */
export function useCycling<T>(
  items: T[],
  interval: number,
  fadeDuration: number,
): { value: T; fading: boolean } {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setFading(false);
      }, fadeDuration);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval, fadeDuration]);

  return { value: items[index], fading };
}
