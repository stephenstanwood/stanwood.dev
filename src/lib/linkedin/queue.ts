import type {
  LinkedInOutreachPerson,
  LinkedInOutreachSummary,
} from "./types";

const TIER_RANK = { A: 0, B: 1, C: 2 } as const;
export const LINKEDIN_DAILY_BATCH_SIZE = 50;
const AUTO_DISCOVERED_AGENCY_SOURCE = "discovery:lookout-agency";

const CONNECT_CATEGORY_SCORE: Record<string, number> = {
  southbaytoday: 2_000,
  "south-bay-local": 1_950,
  nonprofit: 1_750,
  "church-pclg": 1_700,
  family: 1_650,
  "personal-friend": 1_600,
  "stoa-bid": 1_550,
  "dc-network": 1_200,
  "law-school": 1_100,
  "theater-arts": 950,
  uchicago: 800,
  "chicago-gov-civic": 250,
  "chicago-nonprofit": 220,
  "orr-academy-cps": 200,
  "city-year": 180,
};

function basePriorityScore(person: LinkedInOutreachPerson): number {
  if (person.kind === "organization") {
    const rankedOrder = person.sourceOrder >= 10_000
      ? person.sourceOrder - 10_000
      : person.sourceOrder;
    return 1_475 - rankedOrder * 2;
  }
  if (person.kind === "follow") return 1_500 - person.sourceOrder * 3;
  const category = CONNECT_CATEGORY_SCORE[person.category] ?? 700;
  const batch = Math.max(0, 400 - (person.batch ?? 99) * 50);
  const tier = person.tier ? (3 - TIER_RANK[person.tier]) * 10 : 0;
  return category + batch + tier - person.sourceOrder / 1_000;
}

interface FeedbackCount {
  actioned: number;
  dismissed: number;
}

function feedbackCounts(
  people: LinkedInOutreachPerson[],
  keyFor: (person: LinkedInOutreachPerson) => string,
): Map<string, FeedbackCount> {
  const feedback = new Map<string, FeedbackCount>();
  for (const person of people) {
    const key = keyFor(person);
    const current = feedback.get(key) ?? { actioned: 0, dismissed: 0 };
    if (person.actioned && !person.dismissed) current.actioned += 1;
    else if (person.dismissed) current.dismissed += 1;
    feedback.set(key, current);
  }
  return feedback;
}

function preferenceBonus(counts: FeedbackCount | undefined, maximum: number): number {
  if (!counts) return 0;
  // Two virtual yeses and two virtual passes keep small samples from swinging
  // tomorrow's queue too sharply while still letting repeated choices teach it.
  const smoothedPreference =
    (counts.actioned - counts.dismissed) /
    (counts.actioned + counts.dismissed + 4);
  return Math.round(smoothedPreference * maximum);
}

function learnedPriorityScores(
  people: LinkedInOutreachPerson[],
): Map<string, number> {
  const categoryFeedback = feedbackCounts(people, (person) => person.category);
  const kindFeedback = feedbackCounts(people, (person) => person.kind);
  return new Map(people.map((person) => [
    person.stableId,
    basePriorityScore(person) +
      preferenceBonus(categoryFeedback.get(person.category), 240) +
      preferenceBonus(kindFeedback.get(person.kind), 300),
  ]));
}

/** Batch is the pacing plan; A/B/C is priority inside that batch. */
export function compareLinkedInPriority(
  a: LinkedInOutreachPerson,
  b: LinkedInOutreachPerson,
): number {
  const scoreDelta = basePriorityScore(b) - basePriorityScore(a);
  return scoreDelta || a.sourceOrder - b.sourceOrder || a.name.localeCompare(b.name);
}

export function rankLinkedInOutreach(
  people: LinkedInOutreachPerson[],
): LinkedInOutreachPerson[] {
  const scores = learnedPriorityScores(people);
  return [...people].sort((a, b) =>
    (scores.get(b.stableId) ?? 0) - (scores.get(a.stableId) ?? 0) ||
    compareLinkedInPriority(a, b));
}

export function nextLinkedInDailyBatch(
  people: LinkedInOutreachPerson[],
  limit = LINKEDIN_DAILY_BATCH_SIZE,
): LinkedInOutreachPerson[] {
  return rankLinkedInOutreach(people).filter((person) =>
    (person.kind !== "connect" || person.category !== "unknown") &&
    // Lookout's agency graph is useful private research context, but a directory
    // record is not enough evidence that Stephen should follow the organization.
    // Explicitly curated organizations still compete in the same ranked pile.
    person.source !== AUTO_DISCOVERED_AGENCY_SOURCE &&
    !person.actioned &&
    !person.dismissed
  ).slice(0, limit);
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
    organizations: people.filter((person) => person.kind === "organization").length,
  };
}
