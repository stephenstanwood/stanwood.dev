import { DAY_MS, endOfDay, parseCampbellDate, startOfDay } from "./dateHelpers";

/** The structured date fields shared by every Campbell event feed item. */
export interface EventDateFields {
  startDate?: string;
  endDate?: string;
}

export const LONG_RUNNING_EVENT_DAYS = 14;

export function eventStart(event: EventDateFields): Date | null {
  return parseCampbellDate(event.startDate ?? "");
}

export function eventEnd(event: EventDateFields): Date | null {
  return parseCampbellDate(event.endDate ?? "") ?? eventStart(event);
}

export function eventIsLongRunning(event: EventDateFields): boolean {
  const start = eventStart(event);
  const end = eventEnd(event);
  if (!start || !end) return false;
  return end.getTime() - start.getTime() > LONG_RUNNING_EVENT_DAYS * DAY_MS;
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
  const weekday = reference.getDay();
  const startOffset = weekday === 0 || weekday === 5 || weekday === 6
    ? 0
    : (5 - weekday + 7) % 7;
  const endOffset = weekday === 0
    ? 0
    : weekday === 6
      ? 1
      : startOffset + 2;

  return {
    start: startOfDay(new Date(reference.getTime() + startOffset * DAY_MS)),
    end: endOfDay(new Date(reference.getTime() + endOffset * DAY_MS)),
  };
}
