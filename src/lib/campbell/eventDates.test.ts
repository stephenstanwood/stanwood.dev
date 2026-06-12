import { describe, expect, it } from "vitest";
import { campbellWeekendWindow } from "./eventDates";

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
