/** Shared en-US date/time formatters. */

/** Canonical IANA timezone for this site's Pacific-time content. */
export const PACIFIC_TZ = "America/Los_Angeles";

type DateInput = Date | string | number;

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const MONTH_DAY_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const HOUR_MINUTE = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function toDate(date: DateInput): Date {
  return date instanceof Date ? date : new Date(date);
}

/** e.g. "May 16" */
export function formatMonthDay(date: DateInput): string {
  return MONTH_DAY.format(toDate(date));
}

/** e.g. "May 16" — formatted in the given IANA timezone. */
export function formatMonthDayInTz(date: DateInput, timeZone: string): string {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  });
}

/** e.g. "May 16, 2026" */
export function formatMonthDayYear(date: DateInput): string {
  return MONTH_DAY_YEAR.format(toDate(date));
}

/** e.g. "3:45 PM" */
export function formatHourMinute(date: DateInput): string {
  return HOUR_MINUTE.format(toDate(date));
}

/** Calendar day as "YYYY-MM-DD" in the given IANA timezone (en-CA yields ISO order). */
export function isoDateInTz(date: DateInput, timeZone: string): string {
  return toDate(date).toLocaleDateString("en-CA", { timeZone });
}

/** e.g. "3:45 PM" — formatted in the given IANA timezone. */
export function formatHourMinuteInTz(date: DateInput, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(toDate(date));
}
