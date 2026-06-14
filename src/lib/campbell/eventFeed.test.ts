import { describe, expect, it } from "vitest";
import eventFeed from "../../data/campbellEvents.json";

const absenceTitlePatterns = [
  /^No .+ Practice$/i,
  /^CCC Pool Closed$/i,
  /\bNo School\b/i,
  /\bprograms closed\b/i,
  /^(?:Thanksgiving|Winter|Spring|Presidents'? Week) Break$/i,
  /\bProfessional Development Day\b/i,
  /\bCAASPP Window\b/i,
  /\bIntervention Conferences\b/i,
];

describe("Campbell event feed", () => {
  it("keeps filtered operational notices out of the public payload", () => {
    expect(Object.prototype.hasOwnProperty.call(eventFeed, "rejected")).toBe(false);
  });

  it("does not list absence or operations notices as public events", () => {
    const titles = eventFeed.items.map((event) => event.title);

    for (const title of titles) {
      expect(absenceTitlePatterns.some((pattern) => pattern.test(title)), title).toBe(false);
    }
  });
});
