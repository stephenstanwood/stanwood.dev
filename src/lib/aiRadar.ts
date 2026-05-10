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
 * Curated profiles for the major AI labs. The radar's org chips reference these
 * by exact name so click-to-filter keeps working — keep names in sync with the
 * launch data and ORG_COLORS above.
 */
export interface LabProfile {
  name: string;
  founded: string;
  hq: string;
  oneLine: string;
  signature: string;
  flag: string;
  stance: "closed" | "open" | "mixed" | "infra";
}

export const LAB_PROFILES: LabProfile[] = [
  {
    name: "OpenAI",
    founded: "2015",
    hq: "San Francisco",
    oneLine: "Set the pace for the modern wave — ChatGPT made conversational AI a household tool overnight.",
    signature: "GPT-5 · ChatGPT · Sora · Realtime API",
    flag: "🇺🇸",
    stance: "closed",
  },
  {
    name: "Anthropic",
    founded: "2021",
    hq: "San Francisco",
    oneLine: "Founded by ex-OpenAI safety researchers; Claude is the model coding tools quietly standardize on.",
    signature: "Claude Sonnet · Claude Opus · MCP · Skills",
    flag: "🇺🇸",
    stance: "closed",
  },
  {
    name: "Google",
    founded: "2014",
    hq: "Mountain View / London",
    oneLine: "DeepMind + Brain merged into the Gemini team; the only lab with the chips, the data, and the products.",
    signature: "Gemini 3 · AI Studio · Vertex · Veo",
    flag: "🇺🇸",
    stance: "mixed",
  },
  {
    name: "Meta",
    founded: "2013",
    hq: "Menlo Park",
    oneLine: "Open-weights leader in the West — Llama set the floor every other open lab is measured against.",
    signature: "Llama · Movie Gen · Ray-Ban Display",
    flag: "🇺🇸",
    stance: "open",
  },
  {
    name: "xAI",
    founded: "2023",
    hq: "Palo Alto",
    oneLine: "Musk's lab. Massive Memphis training cluster, edgier brand voice, integrated tightly with X.",
    signature: "Grok · Colossus supercluster",
    flag: "🇺🇸",
    stance: "mixed",
  },
  {
    name: "Mistral",
    founded: "2023",
    hq: "Paris",
    oneLine: "Europe's flagship lab — punches above its weight on small, efficient, mostly open-weights models.",
    signature: "Mistral Large · Mixtral · Codestral",
    flag: "🇫🇷",
    stance: "open",
  },
  {
    name: "DeepSeek",
    founded: "2023",
    hq: "Hangzhou",
    oneLine: "Sparked the 2025 cost-collapse — frontier-class reasoning at a fraction of the price, weights and all.",
    signature: "DeepSeek-R1 · V3 · open weights",
    flag: "🇨🇳",
    stance: "open",
  },
  {
    name: "Alibaba",
    founded: "2023",
    hq: "Hangzhou",
    oneLine: "Qwen team ships open-weights models at every size with ruthless cadence — the workhorse of Chinese AI.",
    signature: "Qwen 3 · Qwen-VL · Qwen-Coder",
    flag: "🇨🇳",
    stance: "open",
  },
  {
    name: "NVIDIA",
    founded: "1993",
    hq: "Santa Clara",
    oneLine: "Sells the picks and shovels. Every other lab on this list trains on its chips — H100, B200, GB200, and counting.",
    signature: "Blackwell · CUDA · NeMo · Nemotron",
    flag: "🇺🇸",
    stance: "infra",
  },
];

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
  const date = parseLaunchDate(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
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

/** Human-readable date range for a sorted (newest-first) Launch array. */
export function getDateRange(items: Launch[]): string {
  if (items.length === 0) return "";
  const dates = items.map((l) => parseLaunchDate(l.date));
  const oldest = dates[dates.length - 1];
  const newest = dates[0];
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (oldest.toDateString() === newest.toDateString()) return fmt(newest);
  if (oldest.getFullYear() !== newest.getFullYear())
    return `${fmt(oldest)} ${oldest.getFullYear()} – ${fmt(newest)} ${newest.getFullYear()}`;
  return `${fmt(oldest)} – ${fmt(newest)}`;
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

export interface PulseStats {
  thisWeek: number;
  priorWeek: number;
  weekDelta: number;
  daysSinceLast: number | null;
  topOrg: { name: string; count: number } | null;
  topType: { type: string; count: number } | null;
  totalLast30: number;
  typeBreakdown: { type: string; count: number; pct: number }[];
}

/**
 * Compute at-a-glance stats for the radar — pace this week vs prior, freshness,
 * top org and type over the last 30 days, plus a stacked breakdown of types.
 * Pass the unsorted or sorted launches; ordering doesn't matter.
 */
export function computePulse(launches: Launch[]): PulseStats {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  const dayDiff = (d: string) => Math.floor((now - parseLaunchDate(d).getTime()) / day);

  let thisWeek = 0;
  let priorWeek = 0;
  let totalLast30 = 0;
  let minDaysAgo: number | null = null;
  const orgCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  for (const l of launches) {
    const d = dayDiff(l.date);
    if (d < 0) continue; // skip future-dated entries
    if (minDaysAgo === null || d < minDaysAgo) minDaysAgo = d;
    if (d < 7) thisWeek++;
    else if (d < 14) priorWeek++;
    if (d < 30) {
      totalLast30++;
      orgCounts[l.org] = (orgCounts[l.org] || 0) + 1;
      typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
    }
  }

  const topOrgEntry = Object.entries(orgCounts).sort((a, b) => b[1] - a[1])[0];
  const topTypeEntry = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  const typeBreakdown = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      count,
      pct: totalLast30 > 0 ? Math.round((count / totalLast30) * 100) : 0,
    }));

  return {
    thisWeek,
    priorWeek,
    weekDelta: thisWeek - priorWeek,
    daysSinceLast: minDaysAgo,
    topOrg: topOrgEntry ? { name: topOrgEntry[0], count: topOrgEntry[1] } : null,
    topType: topTypeEntry ? { type: topTypeEntry[0], count: topTypeEntry[1] } : null,
    totalLast30,
    typeBreakdown,
  };
}
