/** Shared "days since last ship" status used by ShipClock and RepoTracker. */
export function shipStatus(days: number): { label: string; tone: string } {
  if (days === 0) return { label: "shipped today", tone: "hot" };
  if (days === 1) return { label: "shipped yesterday", tone: "good" };
  if (days <= 3) return { label: "fresh off the line", tone: "good" };
  if (days <= 6) return { label: "clock is ticking", tone: "warn" };
  if (days <= 13) return { label: "getting rusty", tone: "warn" };
  return { label: "dust is collecting", tone: "bad" };
}
