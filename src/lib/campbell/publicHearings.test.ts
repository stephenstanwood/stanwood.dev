import { describe, expect, it } from "vitest";
import hearingFeed from "../../data/campbellPublicHearings.json";

interface PublicHearing {
  body: string;
  hearingAt: string;
  fileNo?: string;
  agendaUrl?: string;
  noticeUrl?: string;
}

const HEARINGS = hearingFeed.items as PublicHearing[];

function hearingDay(value: string) {
  return value
    .replace(/\bat\b.*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

describe("Campbell public hearings feed", () => {
  it("does not show agenda and notice records as separate cards for the same file", () => {
    const keys = HEARINGS
      .filter((item) => item.fileNo)
      .map((item) => `${item.body}|${item.fileNo}|${hearingDay(item.hearingAt)}`);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps both official links when a notice has a matching agenda packet", () => {
    const pruneyard = HEARINGS.find((item) => item.fileNo === "PLN-2026-82");

    expect(pruneyard?.noticeUrl).toContain("ADID=3456");
    expect(pruneyard?.agendaUrl).toContain("/AgendaCenter/ViewFile/Agenda/");
  });
});
