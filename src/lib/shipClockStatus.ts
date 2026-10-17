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
}

/** The "days since last ship" ladder, checked in order; the last tier is open-ended. */
const SHIP_TIERS: ShipTier[] = [
  { maxDays: 0, label: "shipped today", tone: "hot" },
  { maxDays: 1, label: "shipped yesterday", tone: "good" },
  { maxDays: 3, label: "fresh off the line", tone: "good" },
  { maxDays: 6, label: "clock is ticking", tone: "warn" },
  { maxDays: 13, label: "getting rusty", tone: "warn" },
  { maxDays: null, label: "dust is collecting", tone: "bad" },
];

/** "Days since last ship" status label and tone for RepoTracker. */
export function shipStatus(days: number): { label: string; tone: string } {
  const tier =
    SHIP_TIERS.find((t) => t.maxDays === null || days <= t.maxDays) ??
    SHIP_TIERS[SHIP_TIERS.length - 1];
  return { label: tier.label, tone: tier.tone };
}
