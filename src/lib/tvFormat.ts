import { daysSince } from "./time";

/** Compact queue-row runtime: "45m", "1h05". */
export function compactDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}m`;
}

/** Compact queue-row age: "today", "3d ago", "2w ago", "4mo ago". */
export function compactAge(iso: string, now = Date.now()): string {
  const days = daysSince(iso, now);
  if (days === 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
