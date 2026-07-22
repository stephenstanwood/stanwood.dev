import { MS_PER_DAY } from "../time";

/** Alias of the canonical day constant in time.ts, kept so Campbell importers don't redefine it. */
export const DAY_MS = MS_PER_DAY;
export const CAMPBELL_TIME_ZONE = "America/Los_Angeles";

// Council/hearing feeds are considered stale once the newest record is this old.
export const COUNCIL_SOURCE_STALE_AFTER_DAYS = 90;

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/** Pull one `formatToParts` entry out by type, or undefined if absent. */
export const datePart = (parts: Intl.DateTimeFormatPart[], type: string) =>
  parts.find((item) => item.type === type)?.value;

const numericPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
  Number(datePart(parts, type));

function campbellDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPBELL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  return {
    year: numericPart(parts, "year"),
    month: numericPart(parts, "month"),
    day: numericPart(parts, "day"),
  };
}

function timeZoneOffsetMs(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPBELL_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(value);

  const asUtc = Date.UTC(
    numericPart(parts, "year"),
    numericPart(parts, "month") - 1,
    numericPart(parts, "day"),
    numericPart(parts, "hour"),
    numericPart(parts, "minute"),
    numericPart(parts, "second"),
  );

  return asUtc - value.getTime();
}

function campbellDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
) {
  const localWallTime = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = localWallTime - timeZoneOffsetMs(new Date(localWallTime));
  instant = localWallTime - timeZoneOffsetMs(new Date(instant));
  return new Date(instant);
}

export function addCampbellDays(value: Date, days: number): Date {
  const parts = campbellDateParts(value);
  return campbellDate(parts.year, parts.month, parts.day + days);
}

/** Normalize a Date to midnight in Campbell, California. */
export function startOfDay(value: Date): Date {
  const parts = campbellDateParts(value);
  return campbellDate(parts.year, parts.month, parts.day);
}

/** Normalize a Date to the last millisecond of its Campbell calendar day. */
export function endOfDay(value: Date): Date {
  return new Date(addCampbellDays(value, 1).getTime() - 1);
}

function parseNamedMonthDate(value: string): Date | null {
  const namedDate = value.match(
    /^(?:(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\s+)?([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})(?:,?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm))?$/i,
  );
  if (!namedDate) return null;

  const [, monthName, day, year, rawHour, rawMinute = "0", meridiem] = namedDate;
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;

  let hour = rawHour ? Number(rawHour) : 0;
  if (meridiem) {
    const lowerMeridiem = meridiem.toLowerCase();
    if (lowerMeridiem === "pm" && hour < 12) hour += 12;
    if (lowerMeridiem === "am" && hour === 12) hour = 0;
  }

  return campbellDate(Number(year), month, Number(day), hour, Number(rawMinute));
}

/**
 * Parse a Campbell feed date string. Feed dates sometimes use "at" and
 * "a.m./p.m." spellings that the Date constructor can't parse on its own, so
 * strip/normalize those before parsing. Timezone-free feed dates are Campbell
 * local wall times, so parse them against Pacific time rather than the server.
 * Returns null for empty/unparseable input.
 */
export function parseCampbellDate(value = ""): Date | null {
  if (!value) return null;
  const normalized = value
    .replace(/\bat\b/i, "")
    .replace(/a\.m\./gi, "AM")
    .replace(/p\.m\./gi, "PM")
    .replace(/\s+/g, " ")
    .trim();

  const isoLocal = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (isoLocal) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = isoLocal;
    return campbellDate(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
  }

  const namedMonthDate = parseNamedMonthDate(normalized);
  if (namedMonthDate) return namedMonthDate;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
