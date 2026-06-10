export const DAY_MS = 24 * 60 * 60 * 1000;

// Council/hearing feeds are considered stale once the newest record is this old.
export const COUNCIL_SOURCE_STALE_AFTER_DAYS = 90;

/** Normalize a Date to local midnight. */
export function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Normalize a Date to the last millisecond of its local day. */
export function endOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * Parse a Campbell feed date string. Feed dates sometimes use "at" and
 * "a.m./p.m." spellings that the Date constructor can't parse on its own, so
 * strip/normalize those before parsing. Returns null for empty/unparseable input.
 */
export function parseCampbellDate(value = ""): Date | null {
  if (!value) return null;
  const normalized = value
    .replace(/\bat\b/i, "")
    .replace(/a\.m\./gi, "AM")
    .replace(/p\.m\./gi, "PM");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
