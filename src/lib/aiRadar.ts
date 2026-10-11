/**
 * Shared constants and helpers for the AI Radar components (tile + page).
 */

import { daysSince } from "./time";
import { formatMonthDay } from "./dateFormat";

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
  "Hugging Face": "#ffcc00",
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
function parseLaunchDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

/**
 * How long ago a launch date was, expressed as a human-readable string.
 * Returns "today", "yesterday", "Nd ago", "Nw ago", "Nmo ago", or "Nyr ago".
 */
export function relativeAge(dateStr: string): string {
  const diff = daysSince(parseLaunchDate(dateStr));
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

/** Format a launch date for both the radar timeline and homepage tile. */
export function formatLaunchDate(dateStr: string): {
  dayName: string;
  dayNum: string;
  month: string;
  year: string;
} {
  const date = parseLaunchDate(dateStr);
  return {
    dayName: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    dayNum: date.getDate().toString(),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year: date.getFullYear().toString(),
  };
}

/** Sort launches newest first. */
export function sortLaunches(launches: Launch[]): Launch[] {
  return launches.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Human-readable date range for a sorted (newest-first) Launch array. */
export function getDateRange(items: Launch[]): string {
  if (items.length === 0) return "";
  const oldest = parseLaunchDate(items[items.length - 1].date);
  const newest = parseLaunchDate(items[0].date);
  if (oldest.toDateString() === newest.toDateString()) return formatMonthDay(newest);
  if (oldest.getFullYear() !== newest.getFullYear())
    return `${formatMonthDay(oldest)} ${oldest.getFullYear()} – ${formatMonthDay(newest)} ${newest.getFullYear()}`;
  return `${formatMonthDay(oldest)} – ${formatMonthDay(newest)}`;
}

/** Group an array of launches by date, newest first. */
export function groupByDate(items: Launch[]): { date: string; launches: Launch[] }[] {
  const groups: Record<string, Launch[]> = {};
  for (const launch of items) {
    if (!groups[launch.date]) groups[launch.date] = [];
    groups[launch.date].push(launch);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([date, launches]) => ({ date, launches }));
}
