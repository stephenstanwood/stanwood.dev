import type {
  LinkedInOutreachPerson,
  LinkedInOutreachSummary,
} from "./types";

const TIER_RANK = { A: 0, B: 1, C: 2 } as const;
export const LINKEDIN_DAILY_BATCH_SIZE = 60;

/** Batch is the pacing plan; A/B/C is priority inside that batch. */
export function compareLinkedInPriority(
  a: LinkedInOutreachPerson,
  b: LinkedInOutreachPerson,
): number {
  if (a.kind === "connect" && b.kind === "connect") {
    const batchDelta = (a.batch ?? 999) - (b.batch ?? 999);
    if (batchDelta) return batchDelta;
    const tierDelta = (a.tier ? TIER_RANK[a.tier] : 3) -
      (b.tier ? TIER_RANK[b.tier] : 3);
    if (tierDelta) return tierDelta;
  }
  return a.sourceOrder - b.sourceOrder || a.name.localeCompare(b.name);
}

export function nextLinkedInDailyBatch(
  people: LinkedInOutreachPerson[],
  limit = LINKEDIN_DAILY_BATCH_SIZE,
): LinkedInOutreachPerson[] {
  return people
    .filter((person) =>
      person.kind === "connect" &&
      person.category !== "unknown" &&
      !person.actioned &&
      !person.dismissed
    )
    .sort(compareLinkedInPriority)
    .slice(0, limit);
}

export function summarizeLinkedInOutreach(
  people: LinkedInOutreachPerson[],
): LinkedInOutreachSummary {
  const dismissed = people.filter((person) => person.dismissed).length;
  const actioned = people.filter((person) => person.actioned && !person.dismissed).length;
  const active = people.length - dismissed;
  const reviewed = people.filter((person) => person.dismissed || person.actioned).length;
  return {
    total: people.length,
    active,
    actioned,
    dismissed,
    reviewed,
    remaining: active - actioned,
    connects: people.filter((person) => person.kind === "connect").length,
    follows: people.filter((person) => person.kind === "follow").length,
  };
}
