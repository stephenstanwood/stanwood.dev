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

function toDate(d: DateInput): Date {
  return d instanceof Date ? d : new Date(d);
}

/** e.g. "May 16" */
export function formatMonthDay(d: DateInput): string {
  return MONTH_DAY.format(toDate(d));
}

/** e.g. "May 16, 2026" */
export function formatMonthDayYear(d: DateInput): string {
  return MONTH_DAY_YEAR.format(toDate(d));
}

/** e.g. "3:45 PM" */
export function formatHourMinute(d: DateInput): string {
  return HOUR_MINUTE.format(toDate(d));
}

/** e.g. "3:45 PM" — formatted in the given IANA timezone. */
export function formatHourMinuteInTz(d: DateInput, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(toDate(d));
}
