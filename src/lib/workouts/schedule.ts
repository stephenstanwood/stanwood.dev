/**
 * /workouts: the coming week of classes at Courtside and Club LG, today first. Weekday classes
 * start at 3 PM or later and finish by 5:30 PM; Saturday and Sunday classes start at 8 AM or later
 * and finish by noon. Same rules as Stephen's /workouts chat skill: cancelled classes are left
 * out, and a streamed copy folds into its in-person class as "Also virtual".
 */

import { createTtlCache } from "../ttlCache";
import { addDaysIso, isWeekday, monthDayLabel, pacificClock, shortDateLabel, weekdayName } from "./clock";
import { fetchClubLg, fetchCourtside } from "./sources";
import type { ClubKey, DayWindow, ScheduleDay, SourceStatus, WorkoutClass, WorkoutSchedule } from "./types";

/** Weekdays, 3:00 to 5:30 PM. */
export const WEEKDAY_WINDOW: DayWindow = { startMin: 15 * 60, endMin: 17 * 60 + 30 };
/** Saturday and Sunday, 8:00 AM to noon. */
export const WEEKEND_WINDOW: DayWindow = { startMin: 8 * 60, endMin: 12 * 60 };
/** Today and the six days after it; one more day waits in reserve. */
const DAYS_SHOWN = 7;

export function windowFor(date: string): DayWindow {
  return isWeekday(date) ? WEEKDAY_WINDOW : WEEKEND_WINDOW;
}

/** `count` consecutive dates starting with `todayIso`. */
export function upcomingDates(todayIso: string, count: number): string[] {
  return Array.from({ length: count }, (_, offset) => addDaysIso(todayIso, offset));
}

/** The class fits entirely inside its day's window. */
export function inWindow(item: Pick<WorkoutClass, "date" | "startMin" | "endMin">): boolean {
  const { startMin, endMin } = windowFor(item.date);
  return item.startMin >= startMin && item.endMin <= endMin && item.endMin > item.startMin;
}

/**
 * Club LG streams some classes alongside the in-person session. A stream with an in-person twin
 * (same club, day, times and instructor) becomes an "Also virtual" tag; a stream-only class stays.
 */
export function mergeVirtualTwins(classes: WorkoutClass[]): WorkoutClass[] {
  const inPerson = classes.filter((item) => !item.virtual);
  const merged = [...inPerson];
  for (const stream of classes.filter((item) => item.virtual)) {
    const twin = inPerson.find(
      (item) =>
        item.club === stream.club &&
        item.date === stream.date &&
        item.startMin === stream.startMin &&
        item.endMin === stream.endMin &&
        (item.instructor ?? "") === (stream.instructor ?? ""),
    );
    if (!twin) {
      merged.push(stream);
    } else if (!twin.tags.some((tag) => tag.kind === "virtual")) {
      twin.tags.push({ kind: "virtual", label: "Also virtual" });
    }
  }
  return merged;
}

const CLUB_ORDER: Record<ClubKey, number> = { courtside: 0, clublg: 1 };

function byTime(a: WorkoutClass, b: WorkoutClass): number {
  return (
    a.startMin - b.startMin ||
    a.endMin - b.endMin ||
    CLUB_ORDER[a.club] - CLUB_ORDER[b.club] ||
    a.title.localeCompare(b.title)
  );
}

function dayHeading(date: string, todayIso: string): string {
  if (date === todayIso) return "Today";
  if (date === addDaysIso(todayIso, 1)) return "Tomorrow";
  return weekdayName(date);
}

/**
 * Group classes into day sections, today first. The reserve day (`extra`, the same weekday next
 * week) shows once today's window has passed, so a full week stays on screen.
 */
export function buildDays(todayIso: string, classes: WorkoutClass[]): ScheduleDay[] {
  const dates = upcomingDates(todayIso, DAYS_SHOWN + 1);
  // Cancellations go first, so a stream whose in-person twin was cancelled still shows.
  const eligible = mergeVirtualTwins(
    classes.filter((item) => !item.cancelled && dates.includes(item.date) && inWindow(item)),
  );
  return dates.map((date, index) => {
    const heading = dayHeading(date, todayIso);
    return {
      date,
      isToday: index === 0,
      heading,
      // A weekday heading already names the day; "Today"/"Tomorrow" need it spelled out.
      dateLabel: heading === weekdayName(date) ? monthDayLabel(date) : shortDateLabel(date),
      window: windowFor(date),
      extra: index === DAYS_SHOWN,
      classes: eligible.filter((item) => item.date === date).sort(byTime),
    };
  });
}

function settledStatus(result: PromiseSettledResult<unknown>, club: ClubKey): SourceStatus {
  if (result.status === "fulfilled") return { ok: true };
  console.warn(`[workouts] ${club} schedule unavailable`, result.reason);
  return { ok: false, error: result.reason instanceof Error ? result.reason.message : String(result.reason) };
}

const scheduleCache = createTtlCache<WorkoutSchedule>(4 * 60_000);

export async function getWorkoutSchedule(now = new Date()): Promise<WorkoutSchedule> {
  const todayIso = pacificClock(now).date;
  const cached = scheduleCache.get();
  if (cached && cached.todayIso === todayIso) return cached;

  const dates = upcomingDates(todayIso, DAYS_SHOWN + 1);
  const [courtside, clublg] = await Promise.allSettled([fetchCourtside(dates), fetchClubLg(now)]);

  const classes = [
    ...(courtside.status === "fulfilled" ? courtside.value : []),
    ...(clublg.status === "fulfilled" ? clublg.value : []),
  ];
  const schedule: WorkoutSchedule = {
    generatedAt: now.toISOString(),
    todayIso,
    days: buildDays(todayIso, classes),
    sources: {
      courtside: settledStatus(courtside, "courtside"),
      clublg: settledStatus(clublg, "clublg"),
    },
  };
  if (schedule.sources.courtside.ok && schedule.sources.clublg.ok) scheduleCache.set(schedule);
  return schedule;
}
