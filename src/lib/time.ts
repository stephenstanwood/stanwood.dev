/** Shared millisecond-based time unit constants. */

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

type DateInput = Date | string | number;

function toMs(d: DateInput): number {
  if (d instanceof Date) return d.getTime();
  if (typeof d === "number") return d;
  return new Date(d).getTime();
}

/** Whole days between `from` and now, floored. Negative if `from` is in the future. */
export function daysSince(from: DateInput, now: number = Date.now()): number {
  return Math.floor((now - toMs(from)) / MS_PER_DAY);
}

/** Milliseconds between `from` and now. Negative if `from` is in the future. */
export function msSince(from: DateInput, now: number = Date.now()): number {
  return now - toMs(from);
}
