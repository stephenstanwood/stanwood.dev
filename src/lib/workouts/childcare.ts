/**
 * Childcare hours, read live from each club's own page:
 * - Courtside: the "Courtside" tab on bayclubs.com/amenity/childcare
 *   ("Monday-Friday: 8:00 am -1:00 pm and 3:00 pm-7:00 pm").
 * - Club LG: the "Kid's Club Hours" block on theclublg.com/kidsclub
 *   ("Monday" then "7:45 AM - 1:30 PM & 3 PM - 7:45 PM", one line per day).
 * When a page can't be read the page links to it instead of showing remembered hours.
 */

import { BROWSER_USER_AGENT, fetchWithTimeout } from "../apiHelpers";
import type { ClubChildcare, TimeRange, WeekHours } from "./types";

export const COURTSIDE_CHILDCARE_URL = "https://www.bayclubs.com/amenity/childcare";
export const CLUBLG_CHILDCARE_URL = "https://www.theclublg.com/kidsclub";
const CONNECT_CHILDCARE_URL = "https://bayclubconnect.com/childcare";

const ENTITIES: Record<string, string> = {
  amp: "&",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  ndash: "–",
  mdash: "—",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
};

/** Rough HTML → text lines: block boundaries become line breaks, tags and scripts drop out. */
export function htmlToLines(html: string): string[] {
  return html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => ENTITIES[name.toLowerCase()] ?? entity)
    .split("\n")
    .map((line) => line.replace(/[\s​‍]+/g, " ").trim())
    .filter(Boolean);
}

const DAY_WORD =
  "(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat)";
const DAY_SPEC = new RegExp(
  `^${DAY_WORD}\\b\\.?(?:\\s*(-|–|—|to|through|thru|&|and|,)\\s*${DAY_WORD}\\b\\.?)?\\s*:?`,
  "i",
);

function dayIndex(word: string): number {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(word.slice(0, 3).toLowerCase());
}

/** "Monday-Friday:" → [1..5]; "Saturday & Sunday:" → [6, 0]; "Tuesday" → [2]. */
export function parseDaySpec(line: string): { days: number[]; length: number } | null {
  const match = DAY_SPEC.exec(line);
  if (!match) return null;
  const first = dayIndex(match[1]);
  if (!match[3]) return { days: [first], length: match[0].length };
  const second = dayIndex(match[3]);
  if (/^(&|and|,)$/i.test(match[2])) return { days: [first, second], length: match[0].length };
  const days: number[] = [];
  for (let day = first; days.length < 7; day = (day + 1) % 7) {
    days.push(day);
    if (day === second) break;
  }
  return { days, length: match[0].length };
}

const RANGE =
  /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/gi;

function toMinutes(hour: string, minute: string | undefined, meridiem: string): number {
  return (Number(hour) % 12) * 60 + Number(minute ?? 0) + (meridiem.toLowerCase() === "p" ? 720 : 0);
}

/** "8:00 am -1:00 pm and 3:00 pm-7:00 pm" → [{480, 780}, {900, 1140}] */
export function parseRanges(text: string): TimeRange[] {
  const ranges: TimeRange[] = [];
  for (const m of text.matchAll(RANGE)) {
    const start = toMinutes(m[1], m[2], m[3]);
    const end = toMinutes(m[4], m[5], m[6]);
    if (end > start) ranges.push({ start, end });
  }
  return ranges;
}

/**
 * Read a run of day/hours lines. Hours apply to the most recent day spec, whether they share its
 * line or follow it. The run ends at the first unrelated line once something has been read.
 */
export function parseWeekHours(lines: string[]): WeekHours {
  const hours: WeekHours = {};
  let current: number[] = [];
  let started = false;
  for (const line of lines) {
    const spec = parseDaySpec(line);
    const ranges = parseRanges(spec ? line.slice(spec.length) : line);
    if (!spec && ranges.length === 0) {
      if (started) break;
      continue;
    }
    if (spec) current = spec.days;
    if (ranges.length && current.length) {
      started = true;
      for (const day of current) hours[day] = [...(hours[day] ?? []), ...ranges];
    }
  }
  return hours;
}

/** Every weekday needs hours before a parse counts. */
function weekdaysComplete(hours: WeekHours): boolean {
  return [1, 2, 3, 4, 5].every((day) => (hours[day]?.length ?? 0) > 0);
}

export function parseCourtsideChildcare(html: string): WeekHours | null {
  const pane = /data-w-tab="Courtside"[^>]*class="[^"]*childcare_tabs_content/i.exec(html);
  if (!pane) return null;
  const rest = html.slice(pane.index + pane[0].length);
  const next = rest.search(/data-w-tab="/i);
  const hours = parseWeekHours(htmlToLines(next < 0 ? rest : rest.slice(0, next)));
  return weekdaysComplete(hours) ? hours : null;
}

export function parseClubLgChildcare(html: string): WeekHours | null {
  const lines = htmlToLines(html);
  const heading = lines.findIndex((line) => /kid.?s club hours/i.test(line));
  if (heading < 0) return null;
  const hours = parseWeekHours(lines.slice(heading + 1));
  return weekdaysComplete(hours) ? hours : null;
}

async function readPage(url: string): Promise<string> {
  const response = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": BROWSER_USER_AGENT, Accept: "text/html" } },
    8_000,
  );
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}

async function readHours(url: string, parse: (html: string) => WeekHours | null): Promise<WeekHours | null> {
  try {
    return parse(await readPage(url));
  } catch (error) {
    console.warn("[workouts] childcare hours unavailable", url, error);
    return null;
  }
}

export async function fetchChildcare(): Promise<ClubChildcare[]> {
  const [courtside, clublg] = await Promise.all([
    readHours(COURTSIDE_CHILDCARE_URL, parseCourtsideChildcare),
    readHours(CLUBLG_CHILDCARE_URL, parseClubLgChildcare),
  ]);
  return [
    {
      club: "courtside",
      hours: courtside,
      sourceUrl: COURTSIDE_CHILDCARE_URL,
      reserveUrl: CONNECT_CHILDCARE_URL,
      reserveLabel: "Reserve in Connect",
    },
    {
      club: "clublg",
      hours: clublg,
      sourceUrl: CLUBLG_CHILDCARE_URL,
      reserveUrl: CLUBLG_CHILDCARE_URL,
      reserveLabel: "Reserve",
    },
  ];
}

/** 900 → "3", 1155 → "7:15". */
function hourLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 12 || 12;
  const minute = minutes % 60;
  return minute ? `${hour}:${String(minute).padStart(2, "0")}` : String(hour);
}

/** "3–7 PM", "7:45 AM–1:30 PM". */
export function rangeLabel(range: TimeRange): string {
  const startPm = range.start >= 720;
  const endPm = range.end >= 720;
  if (startPm === endPm) return `${hourLabel(range.start)}–${hourLabel(range.end)} ${endPm ? "PM" : "AM"}`;
  return `${hourLabel(range.start)} ${startPm ? "PM" : "AM"}–${hourLabel(range.end)} ${endPm ? "PM" : "AM"}`;
}
