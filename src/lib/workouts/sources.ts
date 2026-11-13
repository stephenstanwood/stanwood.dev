/**
 * Live class feeds for the two clubs, normalized to WorkoutClass.
 *
 * - Bay Club Courtside: the JSON endpoint behind bayclubs.com/classes. It caps a response at
 *   200 rows, so it's read one day per request.
 * - The Club at Los Gatos: its schedule is a Mindbody widget whose page ships a week of classes
 *   inline (see flight.ts). Mindbody resolves per-class booking links through a private server
 *   call, so Club LG classes link to the club's schedule page, where booking happens.
 */

import { BROWSER_USER_AGENT, fetchWithTimeout, isRecord } from "../apiHelpers";
import { cleanClubLgName, cleanCourtsideTitle, displayName, isAdultGroupClass } from "./clean";
import { pacificClock, parseInstant } from "./clock";
import { extractFlightPayload, findKey, parseFlightRows, resolveRefs } from "./flight";
import { modalityOf } from "./modality";
import type { ClassTag, WorkoutClass } from "./types";

export const COURTSIDE_SCHEDULE_URL = "https://www.bayclubs.com/classes?c2=courtside";
export const CLUBLG_SCHEDULE_URL = "https://www.theclublg.com/class-schedule";

const COURTSIDE_API =
  "https://bayclubs-classes-czdrbdfgdef2h5ef.westus-01.azurewebsites.net/api/getClasses";
const CLUBLG_WIDGET_URL =
  "https://go.mindbodyonline.com/book/widgets/schedules/view/5b42230c593/schedule";

/** Bay Club's own dated listing; a tap on the class there opens its details. */
export function courtsideListingUrl(date: string): string {
  return `${COURTSIDE_SCHEDULE_URL}&d=${date}`;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function minutes(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// ── Bay Club Courtside ──────────────────────────────────────────────────────

export function normalizeCourtside(items: unknown[], requestedDate: string): WorkoutClass[] {
  const classes: WorkoutClass[] = [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    const startMin = minutes(item.timeFromInMinutes);
    const endMin = minutes(item.timeToInMinutes);
    const rawTitle = text(item.title);
    if (startMin === null || endMin === null || !rawTitle) continue;
    if (!isAdultGroupClass(rawTitle, text(item.category))) continue;

    const classDate = text(item.classDate);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(classDate) ? classDate : requestedDate;
    const { title, tags } = cleanCourtsideTitle(rawTitle);
    classes.push({
      club: "courtside",
      id: text(item.id) || `${date}-${startMin}-${title}`,
      date,
      startMin,
      endMin,
      title,
      modality: modalityOf(title, text(item.category)),
      instructor: displayName(text(item.instructor)),
      substitute: item.substitute === true,
      room: text(item.location) || null,
      tags,
      cancelled: text(item.status).toLowerCase() === "cancelled",
      virtual: false,
      url: courtsideListingUrl(date),
    });
  }
  return classes;
}

async function fetchCourtsideDay(date: string): Promise<WorkoutClass[]> {
  const url = new URL(COURTSIDE_API);
  url.searchParams.set("club", "courtside");
  url.searchParams.set("dateFrom", date);
  url.searchParams.set("dateTo", date);
  const response = await fetchWithTimeout(url.toString(), { headers: { Accept: "application/json" } }, 8_000);
  if (!response.ok) throw new Error(`Bay Club schedule answered ${response.status} for ${date}`);
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.items)) {
    throw new Error(`Bay Club schedule sent no class list for ${date}`);
  }
  return normalizeCourtside(body.items, date);
}

/** One request per date. Any failed day fails the club, so a partial week never looks complete. */
export async function fetchCourtside(dates: string[]): Promise<WorkoutClass[]> {
  const days = await Promise.all(dates.map(fetchCourtsideDay));
  return days.flat();
}

// ── The Club at Los Gatos (Mindbody) ────────────────────────────────────────

/** Resolved Mindbody class instances from the widget page HTML. */
export function extractClubLgClasses(html: string): Record<string, unknown>[] {
  const rows = parseFlightRows(extractFlightPayload(html));
  for (const row of rows.values()) {
    const initial = resolveRefs(findKey(row, "initialClasses"), rows);
    const classes = isRecord(initial) ? initial.classes : undefined;
    if (Array.isArray(classes)) return classes.filter(isRecord);
  }
  throw new Error("Club LG's schedule page had no class list");
}

function availabilityTag(item: Record<string, unknown>): ClassTag | null {
  const open = minutes(item.availableOnlineBookings);
  if (open === 0 || (item.bookable === false && item.waitlistable === true)) {
    return { kind: "full", label: item.waitlistable === true ? "Full, waitlist open" : "Full" };
  }
  if (open !== null && open <= 5) return { kind: "spots", label: `${open} ${open === 1 ? "spot" : "spots"} left` };
  return null;
}

const OPENS_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
});

export function normalizeClubLg(items: Record<string, unknown>[], now: Date): WorkoutClass[] {
  const classes: WorkoutClass[] = [];
  for (const item of items) {
    const start = parseInstant(item.startDateTime);
    const durationMin = minutes(item.duration);
    const end =
      parseInstant(item.endDateTime) ??
      (start && durationMin !== null ? new Date(start.getTime() + durationMin * 60_000) : null);
    const rawName = text(item.name);
    if (!start || !end || !rawName || !isAdultGroupClass(rawName)) continue;

    const startClock = pacificClock(start);
    const endClock = pacificClock(end);
    if (endClock.date !== startClock.date) continue;

    const room = text(item.roomName) || null;
    const { title, tags } = cleanClubLgName(rawName, room);
    const virtual = /^virtual$/i.test(room ?? "") || /^virtual\b/i.test(rawName);
    const cancelled = item.cancelled === true;

    if (virtual) tags.push({ kind: "virtual", label: "Virtual" });
    if (!cancelled) {
      const availability = availabilityTag(item);
      if (availability) tags.push(availability);
      const opens = parseInstant(item.bookingWindowStart);
      if (opens && opens > now) tags.push({ kind: "booking", label: `Booking opens ${OPENS_LABEL.format(opens)}` });
    }

    const staff = Array.isArray(item.staff) && isRecord(item.staff[0]) ? item.staff[0] : null;
    const displayTitle = virtual ? title.replace(/^virtual\s+/i, "") : title;
    classes.push({
      club: "clublg",
      id: text(item.id) || `${startClock.date}-${startClock.minutes}-${title}`,
      date: startClock.date,
      startMin: startClock.minutes,
      endMin: endClock.minutes,
      title: displayTitle,
      modality: modalityOf(displayTitle),
      instructor: item.isTbd === true ? null : displayName(text(staff?.displayLabel)),
      substitute: false,
      room: virtual ? null : room,
      tags,
      cancelled,
      virtual,
      url: CLUBLG_SCHEDULE_URL,
    });
  }
  return classes;
}

export async function fetchClubLg(now: Date): Promise<WorkoutClass[]> {
  const response = await fetchWithTimeout(
    CLUBLG_WIDGET_URL,
    { headers: { "User-Agent": BROWSER_USER_AGENT, Accept: "text/html" } },
    10_000,
  );
  if (!response.ok) throw new Error(`Club LG's schedule answered ${response.status}`);
  return normalizeClubLg(extractClubLgClasses(await response.text()), now);
}
