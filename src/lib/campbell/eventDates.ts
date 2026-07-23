import {
  CAMPBELL_TIME_ZONE,
  DAY_MS,
  addCampbellDays,
  datePart,
  endOfDay,
  parseCampbellDate,
  startOfDay,
} from "./dateHelpers";

/** The structured date fields shared by every Campbell event feed item. */
export interface EventDateFields {
  startDate?: string;
  endDate?: string;
}

export interface ResidentEventFields extends EventDateFields {
  title?: string;
  source?: string;
  category?: string;
  description?: string;
  topics?: string[];
}

const LONG_RUNNING_EVENT_DAYS = 14;

export function eventStart(event: EventDateFields): Date | null {
  return parseCampbellDate(event.startDate ?? "");
}

export function eventEnd(event: EventDateFields): Date | null {
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
  return {
    hour: Number(datePart(parts, "hour") ?? "0"),
    minute: Number(datePart(parts, "minute") ?? "0"),
  };
}

function eventHasDisplayTime(value: Date) {
  const { hour, minute } = campbellClockParts(value);
  return hour !== 0 || minute !== 0;
}

/** Format a Campbell date as "Wed, Jul 2" — shared by the events guide and Today tile. */
export function formatEventDay(value: Date) {
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
  const hour = datePart(parts, "hour") ?? "";
  const minute = datePart(parts, "minute") ?? "";
  const dayPeriod = datePart(parts, "dayPeriod") ?? "";
  return `${hour}${minute ? `:${minute}` : ""} ${dayPeriod}`.trim();
}

export function eventDateLabel(event: EventDateFields & { date?: string }, referenceDay?: Date): string {
  const start = eventStart(event);
  if (!start) return event.date || "Date TBA";

  const end = eventEnd(event);
  const startDay = formatEventDay(start);
  const startHasTime = eventHasDisplayTime(start);
  const referenceStart = referenceDay ? startOfDay(referenceDay) : null;

  if (
    referenceStart &&
    end &&
    start.getTime() < referenceStart.getTime() &&
    end.getTime() >= referenceStart.getTime() &&
    campbellDayKey(start) !== campbellDayKey(end)
  ) {
    return `Open through ${formatEventDay(end)}`;
  }

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

/**
 * The Fri–Sun window a given day belongs to. During a weekend the window is
 * the remainder of that weekend; on a weekday it is the upcoming one.
 */
export function campbellWeekendWindow(referenceDay: Date) {
  const reference = startOfDay(referenceDay);
  const weekday = reference.getUTCDay();
  const isWeekend = weekday === 0 || weekday === 5 || weekday === 6;

  // Weekdays jump forward to Friday; weekend days start from the day itself.
  const startOffset = isWeekend ? 0 : (5 - weekday + 7) % 7;

  let endOffset: number;
  if (weekday === 0) {
    endOffset = 0; // Sunday — the weekend ends today
  } else if (weekday === 6) {
    endOffset = 1; // Saturday — one more day to go
  } else {
    endOffset = startOffset + 2; // Friday through Sunday
  }

  return {
    start: addCampbellDays(reference, startOffset),
    end: endOfDay(addCampbellDays(reference, endOffset)),
  };
}

function residentEventPriority(event: ResidentEventFields) {
  const text = [
    event.title ?? "",
    event.source ?? "",
    event.category ?? "",
    event.description ?? "",
    ...(event.topics ?? []),
  ].join(" ");

  if (/council|commission|committee|board|meeting|hearing|public notice/i.test(text)) return 0;
  if (/city of campbell|downtown campbell|campbell museums|heritage theatre|campbell library/i.test(text)) return 1;
  if (/farmers'? market|summer concert|movie night|museum|theatre|library|park|recreation/i.test(text)) return 1;
  if (/\b(?:BLS|ACLS|CPR)\b|first\s*[-–]?\s*aid/i.test(text)) return 4;
  if (/chamber/i.test(text)) return 3;
  return 2;
}

export function compareResidentEvents(a: ResidentEventFields, b: ResidentEventFields) {
  const aStart = eventStart(a);
  const bStart = eventStart(b);
  if (!aStart && !bStart) return (a.title ?? "").localeCompare(b.title ?? "");
  if (!aStart) return 1;
  if (!bStart) return -1;

  const dayDiff = startOfDay(aStart).getTime() - startOfDay(bStart).getTime();
  if (dayDiff !== 0) return dayDiff;

  const priorityDiff = residentEventPriority(a) - residentEventPriority(b);
  if (priorityDiff !== 0) return priorityDiff;

  const timeDiff = aStart.getTime() - bStart.getTime();
  if (timeDiff !== 0) return timeDiff;

  return (a.title ?? "").localeCompare(b.title ?? "");
}
