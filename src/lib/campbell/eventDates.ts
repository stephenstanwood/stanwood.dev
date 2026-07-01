import {
  CAMPBELL_TIME_ZONE,
  DAY_MS,
  addCampbellDays,
  endOfDay,
  parseCampbellDate,
  startOfDay,
} from "./dateHelpers";

/** The structured date fields shared by every Campbell event feed item. */
export interface EventDateFields {
  startDate?: string;
  endDate?: string;
}

const LONG_RUNNING_EVENT_DAYS = 14;

export function eventStart(event: EventDateFields): Date | null {
  return parseCampbellDate(event.startDate ?? "");
}

function eventEnd(event: EventDateFields): Date | null {
  return parseCampbellDate(event.endDate ?? "") ?? eventStart(event);
}

function eventIsLongRunning(event: EventDateFields): boolean {
  const start = eventStart(event);
  const end = eventEnd(event);
  if (!start || !end) return false;
  return end.getTime() - start.getTime() > LONG_RUNNING_EVENT_DAYS * DAY_MS;
}

function campbellDayKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPBELL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function campbellClockParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPBELL_TIME_ZONE,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "0";
  return {
    hour: Number(part("hour")),
    minute: Number(part("minute")),
  };
}

function eventHasDisplayTime(value: Date) {
  const { hour, minute } = campbellClockParts(value);
  return hour !== 0 || minute !== 0;
}

function formatEventDay(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPBELL_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(value);
}

function formatEventTime(value: Date) {
  const { minute: displayMinute } = campbellClockParts(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPBELL_TIME_ZONE,
    hour: "numeric",
    minute: displayMinute === 0 ? undefined : "2-digit",
  }).formatToParts(value);
  const hour = parts.find((item) => item.type === "hour")?.value ?? "";
  const minute = parts.find((item) => item.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((item) => item.type === "dayPeriod")?.value ?? "";
  return `${hour}${minute ? `:${minute}` : ""} ${dayPeriod}`.trim();
}

export function eventDateLabel(event: EventDateFields & { date?: string }): string {
  const start = eventStart(event);
  if (!start) return event.date || "Date TBA";

  const end = eventEnd(event);
  const startDay = formatEventDay(start);
  const startHasTime = eventHasDisplayTime(start);

  if (!end || campbellDayKey(start) === campbellDayKey(end)) {
    if (!startHasTime) return startDay;

    const endHasTime = end ? eventHasDisplayTime(end) : false;
    if (endHasTime && end && end.getTime() !== start.getTime()) {
      return `${startDay}, ${formatEventTime(start)}-${formatEventTime(end)}`;
    }

    return `${startDay}, ${formatEventTime(start)}`;
  }

  return `${startDay}-${formatEventDay(end)}`;
}

/**
 * Whether an event belongs in a date window. Long-running events (multi-week
 * series) only count in windows where they start, so a months-long exhibit
 * doesn't pin itself to "today" every single day.
 */
export function eventInWindow(event: EventDateFields, windowStart: Date, windowEnd: Date): boolean {
  const start = eventStart(event);
  const end = eventEnd(event);
  if (!start || !end) return false;
  if (eventIsLongRunning(event)) {
    return start.getTime() >= windowStart.getTime() && start.getTime() <= windowEnd.getTime();
  }
  return start.getTime() <= windowEnd.getTime() && end.getTime() >= windowStart.getTime();
}

export function campbellWeekendWindow(referenceDay: Date) {
  const reference = startOfDay(referenceDay);
  const weekday = reference.getUTCDay();
  const startOffset = weekday === 0 || weekday === 5 || weekday === 6
    ? 0
    : (5 - weekday + 7) % 7;
  const endOffset = weekday === 0
    ? 0
    : weekday === 6
      ? 1
      : startOffset + 2;

  return {
    start: addCampbellDays(reference, startOffset),
    end: endOfDay(addCampbellDays(reference, endOffset)),
  };
}
