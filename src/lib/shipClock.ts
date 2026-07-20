export interface ShipClockHistoryEntry {
  date: string;
  message: string | null;
  sha: string | null;
  prNumber: string | null;
}

export interface ShipClockStats {
  deploysLast30: number;
  avgDaysBetween: number | null;
  streakWeeks: number;
}

export interface ShipClockData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  project?: string | null;
  summary?: string | null;
  sha?: string | null;
  prNumber?: string | null;
  history?: ShipClockHistoryEntry[];
  stats?: ShipClockStats;
  error?: string;
}

export async function fetchShipClockData(): Promise<ShipClockData> {
  const response = await fetch("/api/ship-clock");
  return response.json() as Promise<ShipClockData>;
}
