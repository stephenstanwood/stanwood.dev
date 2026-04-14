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
  Meta: "#1877f2",
  Microsoft: "#00a1f1",
  Mistral: "#f1501b",
  Runway: "#5a5a5a",
  Alibaba: "#ff6a00",
  Lightricks: "#a855f7",
  Apple: "#555",
  xAI: "#1d9bf0",
  NVIDIA: "#76b900",
  Inception: "#e63946",
  ByteDance: "#ff004f",
  MiniMax: "#6366f1",
  DeepSeek: "#4d6bfe",
  "Z.ai (Zhipu AI)": "#0ea5e9",
  Cursor: "#6366f1",
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
 * Returns "today", "yesterday", "Nd ago", "Nw ago", "Nmo ago", or "Nyr ago".
 */
export function relativeAge(dateStr: string): string {
  const d = parseLaunchDate(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 14) return "1w ago";
  if (diff < 60) return `${Math.floor(diff / 7)}w ago`;
  const months = Math.round(diff / 30.5);
  if (months < 12) return `${months}mo ago`;
  const years = Math.round(diff / 365);
  return `${years}yr ago`;
}

/** Extract common formatted parts from a parsed Date. Used by formatLaunchDate and formatLaunchDateFull. */
function extractDateParts(d: Date) {
  return {
    dayName: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    dayNum: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year: d.getFullYear().toString(),
  };
}

/** Extract { day, date, month } strings from a YYYY-MM-DD date string. */
export function formatLaunchDate(dateStr: string): { day: string; date: string; month: string } {
  const { dayName, dayNum, month } = extractDateParts(parseLaunchDate(dateStr));
  return { day: dayName, date: dayNum, month };
}

/** Extract { dayName, dayNum, month, year } strings from a YYYY-MM-DD date string. */
export function formatLaunchDateFull(dateStr: string): { dayName: string; dayNum: string; month: string; year: string } {
  return extractDateParts(parseLaunchDate(dateStr));
}

/** Sort launches newest first. */
export function sortLaunches(launches: Launch[]): Launch[] {
  return launches.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
