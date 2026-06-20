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

/** Compact relative-time label: "just now", "5m ago", "3h ago", "yesterday", "4d ago". */
export function timeAgo(from: DateInput, now: number = Date.now()): string {
  const diff = msSince(from, now);
  const mins = Math.floor(diff / MS_PER_MINUTE);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / MS_PER_HOUR);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / MS_PER_DAY);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}
