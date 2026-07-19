import type {
  LinkedInOutreachPerson,
  LinkedInOutreachSummary,
} from "./types";

const TIER_RANK = { A: 0, B: 1, C: 2 } as const;
export const LINKEDIN_DAILY_BATCH_SIZE = 50;
const DAILY_CONNECT_TARGET = 10;

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
  if (person.kind === "organization") return 1_000_000 - person.sourceOrder;
  if (person.kind === "follow") return 1_500 - person.sourceOrder * 3;
  const category = CONNECT_CATEGORY_SCORE[person.category] ?? 700;
  const batch = Math.max(0, 400 - (person.batch ?? 99) * 50);
  const tier = person.tier ? (3 - TIER_RANK[person.tier]) * 10 : 0;
  return category + batch + tier - person.sourceOrder / 1_000;
}

function categoryFeedback(people: LinkedInOutreachPerson[]): Map<string, number> {
  const feedback = new Map<string, number>();
  for (const person of people) {
    const current = feedback.get(person.category) ?? 0;
    if (person.actioned && !person.dismissed) feedback.set(person.category, current + 28);
    else if (person.dismissed) feedback.set(person.category, current - 22);
  }
  for (const [category, score] of feedback) {
    feedback.set(category, Math.max(-360, Math.min(360, score)));
  }
  return feedback;
}

/** Batch is the pacing plan; A/B/C is priority inside that batch. */
export function compareLinkedInPriority(
  a: LinkedInOutreachPerson,
  b: LinkedInOutreachPerson,
): number {
  const scoreDelta = basePriorityScore(b) - basePriorityScore(a);
  return scoreDelta || a.sourceOrder - b.sourceOrder || a.name.localeCompare(b.name);
}

export function nextLinkedInDailyBatch(
  people: LinkedInOutreachPerson[],
  limit = LINKEDIN_DAILY_BATCH_SIZE,
): LinkedInOutreachPerson[] {
  const feedback = categoryFeedback(people);
  const score = (person: LinkedInOutreachPerson) =>
    basePriorityScore(person) + (feedback.get(person.category) ?? 0);
  const candidates = people.filter((person) =>
    (person.kind === "connect" || person.kind === "follow") &&
    (person.kind !== "connect" || person.category !== "unknown") &&
    !person.actioned &&
    !person.dismissed
  );
  const connects = candidates
    .filter((person) => person.kind === "connect")
    .sort((a, b) => score(b) - score(a) || compareLinkedInPriority(a, b));
  const follows = candidates
    .filter((person) => person.kind === "follow")
    .sort((a, b) => score(b) - score(a) || compareLinkedInPriority(a, b));

  const connectTarget = Math.min(DAILY_CONNECT_TARGET, limit, connects.length);
  const selected = [
    ...connects.slice(0, connectTarget),
    ...follows.slice(0, Math.max(0, limit - connectTarget)),
  ];
  if (selected.length < limit) {
    selected.push(...connects.slice(connectTarget, connectTarget + (limit - selected.length)));
  }
  return selected
    .sort((a, b) => score(b) - score(a) || compareLinkedInPriority(a, b))
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
    organizations: people.filter((person) => person.kind === "organization").length,
  };
}
