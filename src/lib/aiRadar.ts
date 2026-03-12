/**
 * Shared constants and helpers for the AI Radar components (tile + page).
 */

export interface Launch {
  name: string;
  org: string;
  date: string;
  type: string;
  summary: string;
  url: string;
}

/** Brand color per org — falls back to "#888" if unknown. */
export const ORG_COLORS: Record<string, string> = {
  OpenAI: "#10a37f",
  Anthropic: "#d97706",
  Google: "#4285f4",
  Alibaba: "#ff6a00",
  Lightricks: "#a855f7",
  Apple: "#555",
  xAI: "#1d9bf0",
  NVIDIA: "#76b900",
  Inception: "#e63946",
  ByteDance: "#ff004f",
  MiniMax: "#6366f1",
};

/** Display label per launch type — falls back to "LAUNCH" if unknown. */
export const TYPE_LABELS: Record<string, string> = {
  model: "MODEL",
  product: "PRODUCT",
  tool: "TOOL",
  infra: "INFRA",
};

/**
 * Parse a YYYY-MM-DD date string at noon local time so that formatting
 * functions reflect the correct calendar day regardless of timezone offset.
 */
export function parseLaunchDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

/**
 * How long ago a launch date was, expressed as a human-readable string.
 * Returns "today", "yesterday", "Nd ago", or "Nw ago" for longer spans.
 */
export function relativeAge(dateStr: string): string {
  const d = parseLaunchDate(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 14) return "1w ago";
  return `${Math.floor(diff / 7)}w ago`;
}

/** Extract { day, date, month } strings from a YYYY-MM-DD date string. */
export function formatLaunchDate(dateStr: string): { day: string; date: string; month: string } {
  const d = parseLaunchDate(dateStr);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    date: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

/** Extract { dayName, dayNum, month, year } strings from a YYYY-MM-DD date string. */
export function formatLaunchDateFull(dateStr: string): { dayName: string; dayNum: string; month: string; year: string } {
  const d = parseLaunchDate(dateStr);
  return {
    dayName: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    dayNum: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year: d.getFullYear().toString(),
  };
}

/** Group an array of launches by date, newest first. */
export function groupByDate(items: Launch[]): { date: string; launches: Launch[] }[] {
  const groups: Record<string, Launch[]> = {};
  for (const l of items) {
    if (!groups[l.date]) groups[l.date] = [];
    groups[l.date].push(l);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([date, launches]) => ({ date, launches }));
}
