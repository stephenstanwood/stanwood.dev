// MLB Big Inning schedule: parse ET wall-clock times into UTC instants,
// scrape MLB support page when possible, fall back to a bundled list
// kept in src/data/bigInningSchedule.ts (regenerated nightly on the Mini).
// Source: https://support.mlb.com/s/article/What-Is-MLB-Big-Inning

import {
  BIG_INNING_GENERATED_AT,
  BIG_INNING_RAW,
} from "../data/bigInningSchedule";
import { MS_PER_DAY } from "./time";
import { decodeEntities } from "./htmlUtils";

export interface BigInningWindow {
  start: string; // ISO 8601 UTC
  end: string;
}

export interface BigInningSchedule {
  generated_at: string;
  source: "mlb" | "fallback";
  windows: BigInningWindow[];
}

function isEasternDaylightTime(year: number, month: number, day: number): boolean {
  if (month < 3 || month > 11) return false;
  if (month > 3 && month < 11) return true;
  if (month === 3) {
    const firstDayOfWeek = new Date(Date.UTC(year, 2, 1)).getUTCDay();
    const secondSunday = 8 + ((7 - firstDayOfWeek) % 7);
    return day >= secondSunday;
  }
  const firstDayOfWeek = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - firstDayOfWeek) % 7);
  return day < firstSunday;
}

function easternWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): Date {
  const offset = isEasternDaylightTime(year, month, day) ? 4 : 5;
  return new Date(Date.UTC(year, month - 1, day, hours + offset, minutes));
}

function parseTime(time: string): { hours: number; minutes: number } | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function buildWindow(
  date: string,
  startTime: string,
  endTime: string
): BigInningWindow | null {
  const dateMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!dateMatch) return null;
  const month = parseInt(dateMatch[1], 10);
  const day = parseInt(dateMatch[2], 10);
  let year = parseInt(dateMatch[3], 10);
  if (year < 100) year += 2000;

  const parsedStart = parseTime(startTime);
  const parsedEnd = parseTime(endTime);
  if (!parsedStart || !parsedEnd) return null;

  const startUtc = easternWallTimeToUtc(
    year,
    month,
    day,
    parsedStart.hours,
    parsedStart.minutes,
  );
  let endUtc = easternWallTimeToUtc(
    year,
    month,
    day,
    parsedEnd.hours,
    parsedEnd.minutes,
  );
  // End at 12:30 AM after a 10 PM start rolls into the next day in ET.
  if (endUtc.getTime() <= startUtc.getTime()) {
    endUtc = new Date(endUtc.getTime() + MS_PER_DAY);
  }
  return { start: startUtc.toISOString(), end: endUtc.toISOString() };
}

export function buildFallbackSchedule(): BigInningSchedule {
  return {
    generated_at: BIG_INNING_GENERATED_AT,
    source: "fallback",
    windows: BIG_INNING_RAW.map(([date, startTime, endTime]) =>
      buildWindow(date, startTime, endTime),
    ).filter((window): window is BigInningWindow => window !== null),
  };
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function parseScheduleFromHtml(html: string): BigInningSchedule | null {
  const windows: BigInningWindow[] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  while ((row = rowPattern.exec(html)) !== null) {
    const cells = Array.from(
      row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
    ).map((cellMatch) => stripTags(cellMatch[1]));
    if (cells.length < 4) continue;
    const dateCell = cells[1];
    const startCell = cells[2];
    const endCell = cells[3];
    if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateCell)) continue;
    if (!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(startCell)) continue;
    if (!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(endCell)) continue;
    const window = buildWindow(dateCell, startCell, endCell);
    if (window) windows.push(window);
  }
  if (windows.length === 0) return null;
  return {
    generated_at: new Date().toISOString(),
    source: "mlb",
    windows,
  };
}

export function findActiveWindow(
  schedule: BigInningSchedule | null,
  now: number = Date.now()
): BigInningWindow | null {
  if (!schedule) return null;
  for (const window of schedule.windows) {
    const start = new Date(window.start).getTime();
    const end = new Date(window.end).getTime();
    if (now >= start && now < end) return window;
  }
  return null;
}
