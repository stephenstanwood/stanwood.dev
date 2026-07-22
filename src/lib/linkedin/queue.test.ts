import { describe, expect, it } from "vitest";
import {
  compareLinkedInPriority,
  nextLinkedInDailyBatch,
  rankLinkedInOutreach,
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

  it("selects known, unfinished candidates across every action kind", () => {
    const people = [
      person("done", 1, "A", { actioned: true }),
      person("dismissed", 1, "B", { dismissed: true }),
      person("unknown", 1, "A", { category: "unknown" }),
      person("later", 2, "A"),
      person("next", 1, "C"),
      person("follow", 99, "C", { kind: "follow", batch: null, tier: null, sourceOrder: 1 }),
      person("organization", 99, "C", {
        kind: "organization",
        batch: null,
        tier: null,
        sourceOrder: 1,
      }),
    ];
    expect(nextLinkedInDailyBatch(people).map((entry) => entry.stableId)).toEqual([
      "follow",
      "organization",
      "next",
      "later",
    ]);
  });

  it("builds one 50-item batch from the highest learned priorities without kind quotas", () => {
    const connects = Array.from({ length: 30 }, (_, index) =>
      person(`connect-${index}`, Math.floor(index / 10) + 1, "A", { category: "dc-network" }));
    const follows = Array.from({ length: 60 }, (_, index) =>
      person(`follow-${index}`, 99, "C", {
        kind: "follow",
        batch: null,
        tier: null,
        sourceOrder: index + 1,
      }));
    const organizations = Array.from({ length: 60 }, (_, index) =>
      person(`organization-${index}`, 99, "C", {
        kind: "organization",
        batch: null,
        tier: null,
        sourceOrder: 10_000 + index,
      }));
    const people = [...connects, ...follows, ...organizations];
    const selected = nextLinkedInDailyBatch(people);
    expect(selected).toHaveLength(50);
    expect(selected.some((entry) => entry.kind === "connect")).toBe(true);
    expect(selected.some((entry) => entry.kind === "follow")).toBe(true);
    expect(selected.some((entry) => entry.kind === "organization")).toBe(true);
    expect(selected).toEqual(rankLinkedInOutreach(people).slice(0, 50));
  });

  it("keeps automatically discovered agencies out while allowing curated organizations", () => {
    const generatedAgency = person("generated-agency", 99, "C", {
      kind: "organization",
      batch: null,
      tier: null,
      category: "local-public-sector",
      source: "discovery:lookout-agency",
      sourceOrder: 10_000,
    });
    const curatedOrganization = person("curated-organization", 99, "C", {
      kind: "organization",
      batch: null,
      tier: null,
      category: "local-public-sector",
      source: "discovery:curated-context",
      sourceOrder: 1,
    });

    expect(nextLinkedInDailyBatch([generatedAgency, curatedOrganization])).toEqual([
      curatedOrganization,
    ]);
  });

  it("deprioritizes stale Chicago categories and learns from repeated passes", () => {
    const chicago = person("chicago", 1, "A", { category: "city-year" });
    const current = person("current", 5, "B", { category: "nonprofit" });
    const passes = Array.from({ length: 12 }, (_, index) =>
      person(`pass-${index}`, 1, "A", { category: "city-year", dismissed: true }));
    const selected = nextLinkedInDailyBatch([chicago, current, ...passes], 1);
    expect(selected[0].stableId).toBe("current");
  });

  it("learns both action-kind and category preferences from reviewed cards", () => {
    const connect = person("connect", 1, "A", { category: "neutral-connect" });
    const organization = person("organization", 99, "C", {
      kind: "organization",
      batch: null,
      tier: null,
      category: "local-public-sector",
      sourceOrder: 10_020,
    });
    const organizationYeses = Array.from({ length: 12 }, (_, index) =>
      person(`org-yes-${index}`, 99, "C", {
        kind: "organization",
        batch: null,
        tier: null,
        category: "local-public-sector",
        sourceOrder: 10_100 + index,
        actioned: true,
      }));
    const connectPasses = Array.from({ length: 12 }, (_, index) =>
      person(`connect-pass-${index}`, 1, "A", {
        category: "neutral-connect",
        dismissed: true,
      }));

    expect(nextLinkedInDailyBatch([
      connect,
      organization,
      ...organizationYeses,
      ...connectPasses,
    ], 1)[0].stableId).toBe("organization");
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
