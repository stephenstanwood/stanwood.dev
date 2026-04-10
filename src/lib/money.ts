// ── Types ────────────────────────────────────────────────────────

export interface BreakdownItem {
  name: string;
  cents: number;
}

export interface ManualEntry {
  enteredAt: string;
  cents: number;
  label: string;
}

export interface ServiceEntry {
  totalCents: number | null;
  breakdown?: BreakdownItem[];
  note: string | null;
  manualEntries?: ManualEntry[];
}

export interface MonthEntry {
  month: string;
  collectedAt: string;
  services: Record<string, ServiceEntry>;
}

export interface Subscription {
  name: string;
  cents: number | null;
  category: string;
  url: string;
  note: string | null;
}

export interface Domain {
  name: string;
  registrar: string;
  renewsAt: string | null;
  annualCents: number | null;
  note: string | null;
}

export interface MoneyData {
  lastUpdated: string | null;
  apiSpend: {
    months: MonthEntry[];
  };
  subscriptions: Subscription[];
  domains: Domain[];
}

// ── Service metadata ─────────────────────────────────────────────

export const SERVICE_META: Record<
  string,
  { label: string; color: string; url: string; emoji: string }
> = {
  vercel: {
    label: "Vercel",
    color: "#000",
    url: "https://vercel.com/dashboard",
    emoji: "▲",
  },
  anthropic: {
    label: "Anthropic",
    color: "#d4704c",
    url: "https://console.anthropic.com/settings/billing",
    emoji: "🪩",
  },
  openai: {
    label: "OpenAI",
    color: "#10a37f",
    url: "https://platform.openai.com/usage",
    emoji: "🤖",
  },
  google_cloud: {
    label: "Google Cloud",
    color: "#4285f4",
    url: "https://console.cloud.google.com/billing",
    emoji: "🌎",
  },
};

export const SERVICE_ORDER = ["vercel", "anthropic", "openai", "google_cloud"];

// ── Category colors for subscriptions ────────────────────────────

export const CATEGORY_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  ai: { label: "AI", color: "#ff3d9a", bg: "#ffe6f2" },
  data: { label: "DATA", color: "#2eb8ff", bg: "#e6f6ff" },
  infra: { label: "INFRA", color: "#000", bg: "#f0f0f0" },
  tools: { label: "TOOLS", color: "#ffb938", bg: "#fff6e0" },
  media: { label: "MEDIA", color: "#a4ff3d", bg: "#f0ffe0" },
};

// ── Formatters ───────────────────────────────────────────────────

export function formatCents(cents: number): string {
  if (cents === 0) return "$0";
  const dollars = cents / 100;
  return dollars < 1 ? `${cents}\u00a2` : `$${dollars.toFixed(2)}`;
}

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// ── Data helpers ─────────────────────────────────────────────────

export function getLatestMonth(data: MoneyData): MonthEntry | null {
  const months = data.apiSpend.months;
  if (months.length === 0) return null;
  return months[months.length - 1];
}

export function getApiTotalForMonth(month: MonthEntry | null): number {
  if (!month) return 0;
  return Object.values(month.services).reduce(
    (sum, s) => sum + (s.totalCents ?? 0),
    0,
  );
}

export function getSubscriptionsTotal(subs: Subscription[]): number {
  return subs.reduce((sum, s) => sum + (s.cents ?? 0), 0);
}

export function getMonthlyTotal(data: MoneyData): number {
  const latest = getLatestMonth(data);
  return getApiTotalForMonth(latest) + getSubscriptionsTotal(data.subscriptions);
}

export function getAnnualDomainsTotal(domains: Domain[]): number {
  return domains.reduce((sum, d) => sum + (d.annualCents ?? 0), 0);
}

export function getAnnualRunRate(data: MoneyData): number {
  return getMonthlyTotal(data) * 12 + getAnnualDomainsTotal(data.domains);
}

// ── Date helpers ─────────────────────────────────────────────────

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function formatRenewalDate(dateStr: string | null): string {
  if (!dateStr) return "???";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function sortDomainsByRenewal(domains: Domain[]): Domain[] {
  return [...domains].sort((a, b) => {
    if (!a.renewsAt && !b.renewsAt) return 0;
    if (!a.renewsAt) return 1;
    if (!b.renewsAt) return -1;
    return a.renewsAt.localeCompare(b.renewsAt);
  });
}
