import { describe, expect, it } from "vitest";
import eventFeed from "../../data/campbellEvents.json";

const absenceTitlePatterns = [
  /^No .+ Practice$/i,
  /^CCC Pool Closed$/i,
  /\b(?:library|pool|facility|office|programs?) closed\b/i,
  /\bclosed for\b/i,
  /\bNo School\b/i,
  /\bprograms closed\b/i,
  /^(?:Thanksgiving|Winter|Spring|Presidents'? Week) Break$/i,
  /\bProfessional Development Day\b/i,
  /\bCAASPP Window\b/i,
  /\bIntervention Conferences\b/i,
];

const genericTitleWords = new Set([
  "and",
  "annual",
  "campbell",
  "center",
  "class",
  "classes",
  "concert",
  "event",
  "events",
  "for",
  "from",
  "national",
  "present",
  "presents",
  "show",
  "the",
  "theatre",
  "touring",
  "tribute",
  "with",
]);

function normalizeTitle(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function eventDateKey(event: { startDate?: string; date?: string }) {
  return (event.startDate || event.date || "").slice(0, 10);
}

function hasSpecificEventTime(event: { startDate?: string }) {
  return /\d{4}-\d{2}-\d{2}T(?!00:00)/.test(event.startDate || "");
}

function titleTokens(title = "") {
  return normalizeTitle(title)
    .split(" ")
    .filter((word) => word.length > 2 && !genericTitleWords.has(word));
}

function titleOverlap(firstTitle = "", secondTitle = "") {
  const firstTokens = new Set(titleTokens(firstTitle));
  const secondTokens = new Set(titleTokens(secondTitle));
  let overlap = 0;

  for (const token of firstTokens) {
    if (secondTokens.has(token)) overlap += 1;
  }

  return overlap;
}

function locationsOverlap(firstLocation = "", secondLocation = "") {
  const first = normalizeTitle(firstLocation).replace(/\bcampbell\b/g, "").trim();
  const second = normalizeTitle(secondLocation).replace(/\bcampbell\b/g, "").trim();
  if (!first || !second) return false;
  return first.includes(second) || second.includes(first);
}

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

  it("does not duplicate broad all-day listings when a specific-time listing is available", () => {
    const events = eventFeed.items as {
      title: string;
      location?: string;
      startDate?: string;
      date?: string;
    }[];

    for (let firstIndex = 0; firstIndex < events.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < events.length; secondIndex += 1) {
        const first = events[firstIndex];
        const second = events[secondIndex];
        if (eventDateKey(first) !== eventDateKey(second)) continue;
        if (hasSpecificEventTime(first) === hasSpecificEventTime(second)) continue;
        if (!locationsOverlap(first.location, second.location)) continue;

        const overlap = titleOverlap(first.title, second.title);
        expect(overlap, `${first.title} / ${second.title}`).toBeLessThan(2);
      }
    }
  });
});
