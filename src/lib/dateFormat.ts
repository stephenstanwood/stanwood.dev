/** Shared en-US date/time formatters. */

type DateInput = Date | string | number;

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const HOUR_MINUTE = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function toDate(d: DateInput): Date {
  return d instanceof Date ? d : new Date(d);
}

/** e.g. "May 16" */
export function formatMonthDay(d: DateInput): string {
  return MONTH_DAY.format(toDate(d));
}

/** e.g. "3:45 PM" */
export function formatHourMinute(d: DateInput): string {
  return HOUR_MINUTE.format(toDate(d));
}
