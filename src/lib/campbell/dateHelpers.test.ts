import { describe, expect, it } from "vitest";
import { addCampbellDays, endOfDay, parseCampbellDate, startOfDay } from "./dateHelpers";

describe("Campbell date helpers", () => {
  it("parses timezone-free ISO event times as Campbell local time", () => {
    expect(parseCampbellDate("2026-06-16T19:00:00")?.toISOString()).toBe(
      "2026-06-17T02:00:00.000Z",
    );
    expect(parseCampbellDate("2026-12-16T19:00:00")?.toISOString()).toBe(
      "2026-12-17T03:00:00.000Z",
    );
  });

  it("parses named public-hearing dates as Campbell local time", () => {
    expect(parseCampbellDate("June 16, 2026 at 7:00 PM")?.toISOString()).toBe(
      "2026-06-17T02:00:00.000Z",
    );
  });

  it("anchors today windows to the Campbell calendar day", () => {
    const sundayEveningUtc = new Date("2026-06-15T01:30:00.000Z");

    expect(startOfDay(sundayEveningUtc).toISOString()).toBe("2026-06-14T07:00:00.000Z");
    expect(endOfDay(sundayEveningUtc).toISOString()).toBe("2026-06-15T06:59:59.999Z");
  });

  it("adds Campbell calendar days across daylight-saving changes", () => {
    expect(addCampbellDays(new Date("2026-10-31T07:00:00.000Z"), 2).toISOString()).toBe(
      "2026-11-02T08:00:00.000Z",
    );
  });
});
