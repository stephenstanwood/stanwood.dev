import { describe, expect, it } from "vitest";
import { campbellWeekendWindow, eventDateLabel } from "./eventDates";

function localDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

describe("campbellWeekendWindow", () => {
  it("keeps Friday through Sunday together", () => {
    const friday = campbellWeekendWindow(localDate(2026, 5, 12));

    expect(friday.start.toDateString()).toBe(new Date(2026, 5, 12).toDateString());
    expect(friday.end.toDateString()).toBe(new Date(2026, 5, 14).toDateString());
  });

  it("keeps the remaining weekend when already in it", () => {
    const saturday = campbellWeekendWindow(localDate(2026, 5, 13));
    const sunday = campbellWeekendWindow(localDate(2026, 5, 14));

    expect(saturday.start.toDateString()).toBe(new Date(2026, 5, 13).toDateString());
    expect(saturday.end.toDateString()).toBe(new Date(2026, 5, 14).toDateString());
    expect(sunday.start.toDateString()).toBe(new Date(2026, 5, 14).toDateString());
    expect(sunday.end.toDateString()).toBe(new Date(2026, 5, 14).toDateString());
  });

  it("points weekday residents to the next Friday-Sunday window", () => {
    const monday = campbellWeekendWindow(localDate(2026, 5, 15));

    expect(monday.start.toDateString()).toBe(new Date(2026, 5, 19).toDateString());
    expect(monday.end.toDateString()).toBe(new Date(2026, 5, 21).toDateString());
  });
});

describe("eventDateLabel", () => {
  it("keeps date-only events compact", () => {
    expect(eventDateLabel({ startDate: "2026-06-14T00:00:00" })).toBe("Sun, Jun 14");
  });

  it("shows a Campbell-local time when the event has one", () => {
    expect(eventDateLabel({ startDate: "2026-06-16T19:00:00" })).toBe("Tue, Jun 16, 7 PM");
    expect(eventDateLabel({ startDate: "2026-06-16T10:30:00" })).toBe("Tue, Jun 16, 10:30 AM");
  });

  it("summarizes same-day time ranges", () => {
    expect(eventDateLabel({ startDate: "2026-06-17T11:30", endDate: "2026-06-17T13:00" })).toBe(
      "Wed, Jun 17, 11:30 AM-1 PM",
    );
  });

  it("summarizes multi-day ranges without raw source punctuation", () => {
    expect(eventDateLabel({ startDate: "2026-06-18T19:00", endDate: "2026-06-21T14:00" })).toBe(
      "Thu, Jun 18-Sun, Jun 21",
    );
  });

  it("falls back to the source date when structured dates are missing", () => {
    expect(eventDateLabel({ date: "June date TBA" })).toBe("June date TBA");
    expect(eventDateLabel({})).toBe("Date TBA");
  });
});
