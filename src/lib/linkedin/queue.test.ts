import { describe, expect, it } from "vitest";
import {
  compareLinkedInPriority,
  nextLinkedInDailyBatch,
  summarizeLinkedInOutreach,
} from "./queue";
import type { LinkedInOutreachPerson } from "./types";

function person(
  stableId: string,
  batch: number,
  tier: "A" | "B" | "C",
  overrides: Partial<LinkedInOutreachPerson> = {},
): LinkedInOutreachPerson {
  return {
    stableId,
    kind: "connect",
    name: stableId,
    organization: "",
    title: "",
    category: "test",
    categoryLabel: "test",
    reason: "",
    noteDraft: null,
    noteNeedsEdit: false,
    linkedinUrl: "https://www.linkedin.com/search/results/people/?keywords=test",
    profileUrlFound: false,
    email: null,
    source: "test",
    sourceOrder: batch,
    batch,
    tier,
    flags: [],
    actioned: false,
    actionedAt: null,
    dismissed: false,
    dismissedAt: null,
    updatedAt: "2026-07-19T00:00:00.000Z",
    ...overrides,
  };
}

describe("LinkedIn priority queue", () => {
  it("sorts by pacing batch, then A/B/C priority", () => {
    const sorted = [person("b2a", 2, "A"), person("b1c", 1, "C"), person("b1a", 1, "A")]
      .sort(compareLinkedInPriority)
      .map((entry) => entry.stableId);
    expect(sorted).toEqual(["b1a", "b1c", "b2a"]);
  });

  it("selects the next 60 known, unfinished connections across batch boundaries", () => {
    const people = [
      person("done", 1, "A", { actioned: true }),
      person("dismissed", 1, "B", { dismissed: true }),
      person("unknown", 1, "A", { category: "unknown" }),
      person("later", 2, "A"),
      person("next", 1, "C"),
    ];
    expect(nextLinkedInDailyBatch(people).map((entry) => entry.stableId)).toEqual([
      "next",
      "later",
    ]);
  });

  it("caps a daily snapshot without mutating the source list", () => {
    const people = Array.from({ length: 65 }, (_, index) =>
      person(`person-${index}`, Math.floor(index / 10) + 1, "A"));
    const selected = nextLinkedInDailyBatch(people);
    expect(selected).toHaveLength(60);
    expect(people[0].stableId).toBe("person-0");
  });

  it("counts actioned and dismissed people once", () => {
    const summary = summarizeLinkedInOutreach([
      person("remaining", 1, "A"),
      person("done", 1, "B", { actioned: true }),
      person("nah", 1, "C", { dismissed: true }),
    ]);
    expect(summary).toMatchObject({ total: 3, reviewed: 2, remaining: 1, actioned: 1, dismissed: 1 });
  });
});
