/** Pacific-time calendar math for /workouts. ISO dates are plain "YYYY-MM-DD" strings. */

import { PACIFIC_TZ } from "../dateFormat";

const PACIFIC_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Pacific calendar date and minutes after Pacific midnight for an instant. */
export function pacificClock(instant: Date): { date: string; minutes: number } {
  const parts: Record<string, string> = {};
  for (const part of PACIFIC_PARTS.formatToParts(instant)) parts[part.type] = part.value;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Parse an ISO instant; tolerates .NET's seven fractional digits ("…18:15:00.0000000Z"). */
export function parseInstant(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value.replace(/(\.\d{3})\d+/, "$1"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoToUtcNoon(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function addDaysIso(iso: string, days: number): string {
  const date = isoToUtcNoon(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(iso: string): number {
  return isoToUtcNoon(iso).getUTCDay();
}

export function isWeekday(iso: string): boolean {
  const day = weekdayOf(iso);
  return day >= 1 && day <= 5;
}

const WEEKDAY_LONG = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const DATE_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Monday" */
export function weekdayName(iso: string): string {
  return WEEKDAY_LONG.format(isoToUtcNoon(iso));
}

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "Fri, Nov 13" */
export function shortDateLabel(iso: string): string {
  return DATE_LABEL.format(isoToUtcNoon(iso));
}

/** "Nov 16" */
export function monthDayLabel(iso: string): string {
  return MONTH_DAY.format(isoToUtcNoon(iso));
}
