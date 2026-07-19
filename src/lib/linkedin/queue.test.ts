import { describe, expect, it } from "vitest";
import {
  compareLinkedInPriority,
  currentLinkedInBatch,
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

  it("advances to the first batch with unfinished people", () => {
    const people = [
      person("done", 1, "A", { actioned: true }),
      person("dismissed", 1, "B", { dismissed: true }),
      person("next", 2, "A"),
    ];
    expect(currentLinkedInBatch(people)).toBe(2);
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
