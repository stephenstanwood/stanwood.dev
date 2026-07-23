import { describe, expect, it } from "vitest";
import { campbellWeekendWindow, compareResidentEvents, eventDateLabel } from "./eventDates";

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

  it("labels long-running events as open-through once they are underway", () => {
    expect(
      eventDateLabel(
        { startDate: "2026-02-27T11:00:00-08:00", endDate: "2026-12-13T16:00:00-08:00" },
        localDate(2026, 6, 23),
      ),
    ).toBe("Open through Sun, Dec 13");
  });

  it("falls back to the source date when structured dates are missing", () => {
    expect(eventDateLabel({ date: "June date TBA" })).toBe("June date TBA");
    expect(eventDateLabel({})).toBe("Date TBA");
  });
});

describe("compareResidentEvents", () => {
  it("keeps calendar day ahead of event priority", () => {
    const todayClass = {
      title: "BLS Classes in Campbell",
      source: "Campbell Chamber Events",
      startDate: "2026-07-16T09:00",
    };
    const tomorrowMeeting = {
      title: "Planning Commission Regular Meeting",
      source: "City of Campbell Calendar",
      startDate: "2026-07-17T00:00:00",
    };

    expect([tomorrowMeeting, todayClass].sort(compareResidentEvents)).toEqual([todayClass, tomorrowMeeting]);
  });

  it("promotes public meetings over same-day generic training classes", () => {
    const trainingClass = {
      title: "CPR and First - Aid Classes in Campbell",
      source: "Campbell Chamber Events",
      startDate: "2026-07-16T09:00",
      topics: ["Chamber Events", "Community Events"],
    };
    const cityMeeting = {
      title: "Bicycle and Pedestrian Advisory Committee Meeting",
      source: "City of Campbell Calendar",
      startDate: "2026-07-16T17:00:00",
    };

    expect([trainingClass, cityMeeting].sort(compareResidentEvents)).toEqual([cityMeeting, trainingClass]);
  });

  it("keeps Campbell calendar events ahead of same-day chamber-only listings", () => {
    const chamberEvent = {
      title: "Power Networking Lunch at iniBurger",
      source: "Campbell Chamber Events",
      startDate: "2026-07-28T12:00",
    };
    const cityEvent = {
      title: "Adaptive Dis-Glow Dance",
      source: "City of Campbell Calendar",
      category: "Recreation & Community Services",
      startDate: "2026-07-28T19:00:00",
    };

    expect([chamberEvent, cityEvent].sort(compareResidentEvents)).toEqual([cityEvent, chamberEvent]);
  });
});
