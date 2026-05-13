// MLB Big Inning schedule: parse ET wall-clock times into UTC instants,
// scrape MLB support page when possible, fall back to a bundled list
// kept in src/data/bigInningSchedule.ts (regenerated nightly on the Mini).
// Source: https://support.mlb.com/s/article/What-Is-MLB-Big-Inning

import {
  BIG_INNING_GENERATED_AT,
  BIG_INNING_RAW,
} from "../data/bigInningSchedule";

export interface BigInningWindow {
  start: string; // ISO 8601 UTC
  end: string;
}

export interface BigInningSchedule {
  generated_at: string;
  source: "mlb" | "fallback";
  windows: BigInningWindow[];
}

function isEdt(year: number, month: number, day: number): boolean {
  if (month < 3 || month > 11) return false;
  if (month > 3 && month < 11) return true;
  if (month === 3) {
    const firstDow = new Date(Date.UTC(year, 2, 1)).getUTCDay();
    const secondSunday = 8 + ((7 - firstDow) % 7);
    return day >= secondSunday;
  }
  const firstDow = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - firstDow) % 7);
  return day < firstSunday;
}

function etWallToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): Date {
  const offset = isEdt(year, month, day) ? 4 : 5;
  return new Date(Date.UTC(year, month - 1, day, hours + offset, minutes));
}

function parseTime(t: string): { h: number; m: number } | null {
  const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return { h, m };
}

export function buildWindow(
  date: string,
  startTime: string,
  endTime: string
): BigInningWindow | null {
  const dm = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!dm) return null;
  const month = parseInt(dm[1], 10);
  const day = parseInt(dm[2], 10);
  let year = parseInt(dm[3], 10);
  if (year < 100) year += 2000;

  const s = parseTime(startTime);
  const e = parseTime(endTime);
  if (!s || !e) return null;

  const startUtc = etWallToUtc(year, month, day, s.h, s.m);
  let endUtc = etWallToUtc(year, month, day, e.h, e.m);
  // End at 12:30 AM after a 10 PM start rolls into the next day in ET.
  if (endUtc.getTime() <= startUtc.getTime()) {
    endUtc = new Date(endUtc.getTime() + 24 * 60 * 60 * 1000);
  }
  return { start: startUtc.toISOString(), end: endUtc.toISOString() };
}

export function buildFallbackSchedule(): BigInningSchedule {
  return {
    generated_at: BIG_INNING_GENERATED_AT,
    source: "fallback",
    windows: BIG_INNING_RAW.map(([d, s, e]) => buildWindow(d, s, e)).filter(
      (w): w is BigInningWindow => w !== null
    ),
  };
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseScheduleFromHtml(html: string): BigInningSchedule | null {
  const windows: BigInningWindow[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  while ((row = rowRe.exec(html)) !== null) {
    const cells = Array.from(
      row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
    ).map((m) => stripTags(m[1]));
    if (cells.length < 4) continue;
    const dateCell = cells[1];
    const startCell = cells[2];
    const endCell = cells[3];
    if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateCell)) continue;
    if (!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(startCell)) continue;
    if (!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(endCell)) continue;
    const w = buildWindow(dateCell, startCell, endCell);
    if (w) windows.push(w);
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
  for (const w of schedule.windows) {
    const start = new Date(w.start).getTime();
    const end = new Date(w.end).getTime();
    if (now >= start && now < end) return w;
  }
  return null;
}
