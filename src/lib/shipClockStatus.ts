/** Deploy metadata from the /api/ship-clock endpoint, shared by the ShipClock components. */
export interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  project?: string | null;
  summary?: string | null;
  sha?: string | null;
  prNumber?: string | null;
  error?: string;
}

export interface ShipTier {
  /** Inclusive upper bound in days; null means open-ended. */
  maxDays: number | null;
  label: string;
  tone: "hot" | "good" | "warn" | "bad";
  blurb: string;
}

/**
 * Single source of truth for the "days since last ship" ladder. The counter,
 * RepoTracker, and the cadence ladder on /ship-clock all reach it through
 * `shipStatus` and `shipTierRows`, so labels, tones, and day ranges can't
 * drift apart.
 */
const SHIP_TIERS: ShipTier[] = [
  { maxDays: 0, label: "shipped today", tone: "hot", blurb: "In the zone. Daily-driver project — every day is a build day." },
  { maxDays: 1, label: "shipped yesterday", tone: "good", blurb: "Streak intact. Yesterday still counts — keep the loop tight." },
  { maxDays: 3, label: "fresh off the line", tone: "good", blurb: "Active development. Healthy side-project rhythm — most indie shippers live here." },
  { maxDays: 6, label: "clock is ticking", tone: "warn", blurb: "Between sprints. Not bad — but block out a shipping day before momentum slips." },
  { maxDays: 13, label: "getting rusty", tone: "warn", blurb: "Probably waiting on a decision or a review. A typo fix or version bump resets the clock — momentum compounds." },
  { maxDays: null, label: "dust is collecting", tone: "bad", blurb: "Abandonment risk. Even a README polish counts — ship something, anything, today." },
];

/** Shared "days since last ship" status used by ShipClock and RepoTracker. */
export function shipStatus(days: number): { label: string; tone: string } {
  const tier =
    SHIP_TIERS.find((t) => t.maxDays === null || days <= t.maxDays) ??
    SHIP_TIERS[SHIP_TIERS.length - 1];
  return { label: tier.label, tone: tier.tone };
}

/** The tiers with their day ranges rendered for display ("0d", "2–3d", "14d+"). */
export function shipTierRows(): (ShipTier & { range: string })[] {
  let min = 0;
  return SHIP_TIERS.map((tier) => {
    let range: string;
    if (tier.maxDays === null) {
      range = `${min}d+`;
    } else if (tier.maxDays === min) {
      range = `${min}d`;
    } else {
      range = `${min}–${tier.maxDays}d`;
    }
    min = (tier.maxDays ?? min) + 1;
    return { ...tier, range };
  });
}
