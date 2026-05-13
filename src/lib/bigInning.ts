// MLB Big Inning schedule: parse ET wall-clock times into UTC instants,
// scrape MLB support page when possible, fall back to a hardcoded list.
// Source: https://support.mlb.com/s/article/What-Is-MLB-Big-Inning

export interface BigInningWindow {
  start: string; // ISO 8601 UTC
  end: string;
}

export interface BigInningSchedule {
  generated_at: string;
  source: "mlb" | "fallback";
  windows: BigInningWindow[];
}

// Hardcoded April/May 2026 schedule from MLB support page (pulled 2026-05-13).
// Update when MLB publishes the next month's slate.
const FALLBACK_RAW: ReadonlyArray<readonly [string, string, string]> = [
  ["04/20/26", "8:30 PM", "11:30 PM"],
  ["04/21/26", "7:00 PM", "10:00 PM"],
  ["04/21/26", "10:00 PM", "12:30 AM"],
  ["04/22/26", "8:00 PM", "10:30 PM"],
  ["04/23/26", "4:00 PM", "6:30 PM"],
  ["04/24/26", "8:30 PM", "11:30 PM"],
  ["04/25/26", "7:30 PM", "10:00 PM"],
  ["04/26/26", "2:00 PM", "5:00 PM"],
  ["04/27/26", "8:00 PM", "10:30 PM"],
  ["04/28/26", "7:00 PM", "10:00 PM"],
  ["04/28/26", "10:00 PM", "12:30 AM"],
  ["04/29/26", "3:00 PM", "5:30 PM"],
  ["04/30/26", "1:00 PM", "4:00 PM"],
  ["05/01/26", "8:30 PM", "11:30 PM"],
  ["05/02/26", "7:30 PM", "10:00 PM"],
  ["05/03/26", "2:00 PM", "5:00 PM"],
  ["05/04/26", "8:30 PM", "11:30 PM"],
  ["05/05/26", "7:00 PM", "10:00 PM"],
  ["05/05/26", "10:00 PM", "12:30 AM"],
  ["05/06/26", "7:30 PM", "10:00 PM"],
  ["05/07/26", "2:00 PM", "4:30 PM"],
  ["05/08/26", "8:30 PM", "11:30 PM"],
  ["05/09/26", "7:30 PM", "10:00 PM"],
  ["05/10/26", "2:00 PM", "5:00 PM"],
  ["05/11/26", "8:00 PM", "10:30 PM"],
  ["05/12/26", "7:00 PM", "10:00 PM"],
  ["05/12/26", "10:00 PM", "12:30 AM"],
  ["05/13/26", "8:00 PM", "10:30 PM"],
  ["05/14/26", "2:00 PM", "5:00 PM"],
  ["05/15/26", "8:30 PM", "11:30 PM"],
  ["05/16/26", "7:30 PM", "10:00 PM"],
  ["05/17/26", "2:00 PM", "5:00 PM"],
  ["05/18/26", "8:30 PM", "11:30 PM"],
  ["05/19/26", "7:00 PM", "10:00 PM"],
  ["05/19/26", "10:00 PM", "12:30 AM"],
  ["05/20/26", "8:00 PM", "10:30 PM"],
  ["05/21/26", "9:30 PM", "11:00 PM"],
  ["05/22/26", "8:30 PM", "11:30 PM"],
  ["05/23/26", "4:00 PM", "6:30 PM"],
  ["05/24/26", "2:00 PM", "5:00 PM"],
  ["05/25/26", "3:30 PM", "6:30 PM"],
  ["05/26/26", "7:00 PM", "10:00 PM"],
  ["05/26/26", "10:00 PM", "12:30 AM"],
  ["05/27/26", "8:00 PM", "10:30 PM"],
  ["05/28/26", "7:00 PM", "9:00 PM"],
  ["05/29/26", "8:30 PM", "11:30 PM"],
  ["05/30/26", "4:00 PM", "6:30 PM"],
  ["05/31/26", "2:00 PM", "5:00 PM"],
];

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
    generated_at: new Date().toISOString(),
    source: "fallback",
    windows: FALLBACK_RAW
      .map(([d, s, e]) => buildWindow(d, s, e))
      .filter((w): w is BigInningWindow => w !== null),
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
