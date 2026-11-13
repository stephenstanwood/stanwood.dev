/** Shared shapes for /workouts — weekday late-afternoon classes at two clubs. */

export type ClubKey = "courtside" | "clublg";

export type TagKind =
  | "fee"
  | "prereq"
  | "booking"
  | "heated"
  | "popup"
  | "free"
  | "virtual"
  | "spots"
  | "full";

export interface ClassTag {
  kind: TagKind;
  label: string;
}

export interface WorkoutClass {
  club: ClubKey;
  id: string;
  /** Pacific calendar date, YYYY-MM-DD. */
  date: string;
  /** Minutes after Pacific midnight. */
  startMin: number;
  endMin: number;
  title: string;
  /** Full instructor name, or null when the club doesn't list one. */
  instructor: string | null;
  substitute: boolean;
  room: string | null;
  tags: ClassTag[];
  cancelled: boolean;
  /** Streamed-only session (an in-person twin absorbs its stream as "Also virtual"). */
  virtual: boolean;
  /** Where to sign up: the club's own listing. */
  url: string;
}

export interface SourceStatus {
  ok: boolean;
  error?: string;
}

export interface ScheduleDay {
  date: string;
  isToday: boolean;
  /** "Today", "Tomorrow", or the weekday name. */
  heading: string;
  /** e.g. "Fri, Nov 13" */
  dateLabel: string;
  /** Rendered only once today's window has passed (keeps five weekdays on screen). */
  extra: boolean;
  classes: WorkoutClass[];
  cancelled: WorkoutClass[];
}

export interface TimeRange {
  start: number;
  end: number;
}

/** Ranges keyed by weekday, 0 = Sunday … 6 = Saturday. */
export type WeekHours = Partial<Record<number, TimeRange[]>>;

export interface ClubChildcare {
  club: ClubKey;
  /** Null when the club's page couldn't be read. */
  hours: WeekHours | null;
  /** The club page that lists the hours. */
  sourceUrl: string;
  reserveUrl: string;
  reserveLabel: string;
}

export interface AfternoonSchedule {
  generatedAt: string;
  todayIso: string;
  days: ScheduleDay[];
  sources: Record<ClubKey, SourceStatus>;
  childcare: ClubChildcare[];
}
