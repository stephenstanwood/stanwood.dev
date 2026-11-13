/**
 * /workouts: weekday classes at Courtside and Club LG that start at 3 PM or later and finish by
 * 5:30 PM, today first. Same rules as Stephen's /workouts chat skill: the next five weekdays
 * (today included on a weekday), cancelled classes out of the options, a streamed copy folded
 * into its in-person class as "Also virtual".
 */

import { createTtlCache } from "../ttlCache";
import { addDaysIso, isWeekday, monthDayLabel, pacificClock, shortDateLabel, weekdayName } from "./clock";
import { fetchClubLg, fetchCourtside } from "./sources";
import type { AfternoonSchedule, ClubKey, ScheduleDay, SourceStatus, WorkoutClass } from "./types";

/** 3:00 PM. */
export const WINDOW_START_MIN = 15 * 60;
/** 5:30 PM: a class may end at 5:30, but not start then. */
export const CUTOFF_MIN = 17 * 60 + 30;
const WEEKDAYS_SHOWN = 5;

export const CLUB_NAMES: Record<ClubKey, string> = {
  courtside: "Courtside",
  clublg: "Club LG",
};

/** The next `count` weekdays starting at (and including) `todayIso`. */
export function upcomingWeekdays(todayIso: string, count: number): string[] {
  const days: string[] = [];
  for (let offset = 0; days.length < count && offset < 14; offset++) {
    const date = addDaysIso(todayIso, offset);
    if (isWeekday(date)) days.push(date);
  }
  return days;
}

export function inWindow(item: Pick<WorkoutClass, "startMin" | "endMin">): boolean {
  return item.startMin >= WINDOW_START_MIN && item.endMin <= CUTOFF_MIN && item.endMin > item.startMin;
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

/** Group classes into day sections. On a weekday a sixth day waits in reserve (`extra`). */
export function buildDays(todayIso: string, classes: WorkoutClass[]): ScheduleDay[] {
  const todayIsWeekday = isWeekday(todayIso);
  const dates = upcomingWeekdays(todayIso, WEEKDAYS_SHOWN + (todayIsWeekday ? 1 : 0));
  const eligible = mergeVirtualTwins(classes.filter((item) => dates.includes(item.date) && inWindow(item)));
  return dates.map((date, index) => {
    const onDay = eligible.filter((item) => item.date === date).sort(byTime);
    const heading = dayHeading(date, todayIso);
    return {
      date,
      isToday: date === todayIso,
      heading,
      // A weekday heading already names the day; "Today"/"Tomorrow" need it spelled out.
      dateLabel: heading === weekdayName(date) ? monthDayLabel(date) : shortDateLabel(date),
      extra: todayIsWeekday && index === dates.length - 1,
      classes: onDay.filter((item) => !item.cancelled),
      cancelled: onDay.filter((item) => item.cancelled),
    };
  });
}

function settledStatus(result: PromiseSettledResult<unknown>, club: ClubKey): SourceStatus {
  if (result.status === "fulfilled") return { ok: true };
  console.warn(`[workouts] ${club} schedule unavailable`, result.reason);
  return { ok: false, error: result.reason instanceof Error ? result.reason.message : String(result.reason) };
}

const scheduleCache = createTtlCache<AfternoonSchedule>(4 * 60_000);

export async function getAfternoonSchedule(now = new Date()): Promise<AfternoonSchedule> {
  const todayIso = pacificClock(now).date;
  const cached = scheduleCache.get();
  if (cached && cached.todayIso === todayIso) return cached;

  const dates = upcomingWeekdays(todayIso, WEEKDAYS_SHOWN + 1);
  const [courtside, clublg] = await Promise.allSettled([fetchCourtside(dates), fetchClubLg(now)]);

  const classes = [
    ...(courtside.status === "fulfilled" ? courtside.value : []),
    ...(clublg.status === "fulfilled" ? clublg.value : []),
  ];
  const schedule: AfternoonSchedule = {
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
