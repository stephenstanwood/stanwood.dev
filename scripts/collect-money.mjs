#!/usr/bin/env node
/**
 * collect-money.mjs
 *
 * Queries API usage/cost endpoints (Vercel, Anthropic, OpenAI) and writes
 * monthly spend data to src/data/money.json.
 *
 * Env vars (in .env.local):
 *   VERCEL_TOKEN          — Vercel bearer token (billing access)
 *   ANTHROPIC_ADMIN_KEY   — Anthropic admin key (sk-ant-admin-*)
 *   OPENAI_ADMIN_KEY      — OpenAI admin key (sk-admin-*)
 *   NEON_USAGE_CENTS      — optional manual current-month Neon usage
 *   NEON_USAGE_BREAKDOWN_JSON — optional JSON breakdown for Neon usage
 *   MERCURY_API_TOKEN     — optional read-only Mercury API token
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "src", "data", "money.json");

// ── Load .env.local ──────────────────────────────────────────────
function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = join(__dirname, "..", name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

// ── Helpers ──────────────────────────────────────────────────────
function monthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = new Date(Date.UTC(y, m, 1));
  const to = new Date(Date.UTC(y, m + 1, 1));
  return {
    label: `${y}-${String(m + 1).padStart(2, "0")}`,
    from,
    to,
    fromUnix: Math.floor(from.getTime() / 1000),
    toUnix: Math.floor(to.getTime() / 1000),
  };
}

function centsStr(c) {
  return c < 100 ? `${c}\u00a2` : `$${(c / 100).toFixed(2)}`;
}

function dollarsToCents(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function stripCollectionTimestamps(value) {
  if (Array.isArray(value)) return value.map(stripCollectionTimestamps);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "lastUpdated" && key !== "collectedAt")
      .map(([key, child]) => [key, stripCollectionTimestamps(child)]),
  );
}

function materialFingerprint(value) {
  return JSON.stringify(stripCollectionTimestamps(value));
}

function parseManualCents(name) {
  const raw = process.env[`${name}_USAGE_CENTS`];
  if (!raw) return null;
  const cents = Number.parseInt(raw, 10);
  return Number.isFinite(cents) ? cents : null;
}

function parseManualBreakdown(name) {
  const raw = process.env[`${name}_USAGE_BREAKDOWN_JSON`];
  if (!raw) return [];
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => ({
        name: String(item.name || "Other"),
        cents: Number.parseInt(item.cents, 10),
      }))
      .filter((item) => item.name && Number.isFinite(item.cents) && item.cents >= 0);
  } catch {
    return [];
  }
}

// ── Vercel ───────────────────────────────────────────────────────
async function collectVercel(range) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { totalCents: null, note: "Missing VERCEL_TOKEN" };

  const url = new URL("https://api.vercel.com/v1/billing/charges");
  url.searchParams.set("from", range.from.toISOString());
  url.searchParams.set("to", range.to.toISOString());

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { totalCents: null, note: `Vercel API ${res.status}: ${body.slice(0, 200)}` };
  }

  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim());
  const charges = lines.map((l) => JSON.parse(l));

  // Usage overage only — Pro base fee tracked separately in subscriptions
  const byService = {};
  for (const c of charges) {
    if (c.ChargeCategory !== "Usage") continue;
    const name = c.ServiceName || "Other";
    if (name === "Pro") continue; // base subscription tracked in subscriptions section
    byService[name] = (byService[name] || 0) + (c.BilledCost || 0);
  }

  const breakdown = Object.entries(byService)
    .map(([name, dollars]) => ({ name, cents: Math.round(dollars * 100) }))
    .filter((b) => b.cents > 0)
    .sort((a, b) => b.cents - a.cents);

  const totalCents = breakdown.reduce((s, b) => s + b.cents, 0);
  return { totalCents, breakdown, note: null };
}

// ── Anthropic ────────────────────────────────────────────────────
// Pricing per million tokens (USD). Input / output / cache_read / cache_write.
// Cache read is ~10% of input; cache write is ~125% of input (ephemeral 5m).
const ANTHROPIC_PRICING = {
  "claude-opus-4-7": { in: 15, out: 75 },
  "claude-opus-4-6": { in: 15, out: 75 },
  "claude-opus-4": { in: 15, out: 75 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-sonnet-4-5": { in: 3, out: 15 },
  "claude-sonnet-4": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
  "claude-3-5-sonnet": { in: 3, out: 15 },
  "claude-3-5-haiku": { in: 0.8, out: 4 },
};

function priceFor(model) {
  if (!model) return null;
  // Strip date suffix like "-20251001"
  const base = model.replace(/-\d{8}$/, "");
  return ANTHROPIC_PRICING[base] || null;
}

async function collectAnthropic(range) {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) return { totalCents: null, note: "Missing ANTHROPIC_ADMIN_KEY" };

  // usage_report/messages returns token counts scoped to API keys only
  // (excludes Max-covered Claude Code usage, which is what we want for out-of-pocket tracking)
  const baseUrl = new URL("https://api.anthropic.com/v1/organizations/usage_report/messages");
  baseUrl.searchParams.set("starting_at", range.from.toISOString());
  baseUrl.searchParams.set("ending_at", range.to.toISOString());
  baseUrl.searchParams.append("group_by[]", "model");
  baseUrl.searchParams.append("group_by[]", "api_key_id");

  // Aggregate by model, compute cost manually
  const byModel = {};
  let pageToken = null;
  do {
    const url = new URL(baseUrl);
    if (pageToken) url.searchParams.set("page", pageToken);

    const res = await fetch(url, {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { totalCents: null, note: `Anthropic API ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = await res.json();
    for (const bucket of data.data || []) {
      for (const result of bucket.results || []) {
        const model = result.model || "unknown";
        if (!byModel[model]) byModel[model] = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 };
        byModel[model].input += result.uncached_input_tokens || 0;
        byModel[model].output += result.output_tokens || 0;
        byModel[model].cacheRead += result.cache_read_input_tokens || 0;
        const cc = result.cache_creation || {};
        byModel[model].cacheCreate +=
          (cc.ephemeral_1h_input_tokens || 0) + (cc.ephemeral_5m_input_tokens || 0);
      }
    }
    pageToken = data.has_more ? data.next_page : null;
  } while (pageToken);

  let totalCents = 0;
  let unknownTokens = 0;
  const breakdown = [];
  for (const [model, tokens] of Object.entries(byModel)) {
    const price = priceFor(model);
    if (!price) {
      unknownTokens += tokens.input + tokens.output;
      continue;
    }
    const dollars =
      (tokens.input / 1_000_000) * price.in +
      (tokens.output / 1_000_000) * price.out +
      (tokens.cacheRead / 1_000_000) * (price.in * 0.1) +
      (tokens.cacheCreate / 1_000_000) * (price.in * 1.25);
    const cents = Math.round(dollars * 100);
    totalCents += cents;
    breakdown.push({ name: model.replace(/-\d{8}$/, ""), cents });
  }

  breakdown.sort((a, b) => b.cents - a.cents);
  const filtered = breakdown.filter((b) => b.cents > 0);
  const note =
    unknownTokens > 0
      ? "computed from API key token usage; skipped unpriced Anthropic tokens"
      : "computed from API key token usage (excludes Claude Code on Max)";

  return {
    totalCents,
    breakdown: filtered,
    note,
  };
}

// ── OpenAI ───────────────────────────────────────────────────────
async function collectOpenAI(range) {
  const key = process.env.OPENAI_ADMIN_KEY;
  if (!key) return { totalCents: null, note: "Missing OPENAI_ADMIN_KEY" };

  const url = new URL("https://api.openai.com/v1/organization/costs");
  url.searchParams.set("start_time", String(range.fromUnix));
  url.searchParams.set("end_time", String(range.toUnix));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.set("limit", "31");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { totalCents: null, note: `OpenAI API ${res.status}: ${body.slice(0, 200)}` };
  }

  const data = await res.json();
  const buckets = data.data || [];

  let totalDollars = 0;
  const byLine = {};
  for (const bucket of buckets) {
    for (const result of bucket.results || []) {
      const dollars = Number(result.amount?.value) || 0;
      totalDollars += dollars;
      const line = result.line_item || "api";
      byLine[line] = (byLine[line] || 0) + dollars;
    }
  }

  const breakdown = Object.entries(byLine)
    .map(([name, dollars]) => ({ name, cents: Math.round(dollars * 100) }))
    .sort((a, b) => b.cents - a.cents);

  return { totalCents: Math.round(totalDollars * 100), breakdown, note: null };
}

// ── Neon ─────────────────────────────────────────────────────────
// Neon usage recaps arrive by email. Keep same-month values sticky across
// collector runs unless NEON_USAGE_CENTS is supplied to refresh the amount.
async function collectNeon(existingEntry = null) {
  const manualCents = parseManualCents("NEON");
  if (manualCents !== null) {
    const breakdown = parseManualBreakdown("NEON");
    return {
      totalCents: manualCents,
      breakdown,
      note: "manual from Neon usage recap",
    };
  }
  return existingEntry || { totalCents: null, note: "manual from Neon usage recap email" };
}

// ── Mercury ──────────────────────────────────────────────────────
async function mercuryGet(path, token) {
  const res = await fetch(`https://api.mercury.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Mercury API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function listMercuryTransactions(range, token) {
  const transactions = [];
  let startAfter = null;
  do {
    const url = new URL("https://api.mercury.com/api/v1/transactions");
    url.searchParams.set("postedStart", range.from.toISOString());
    url.searchParams.set("postedEnd", range.to.toISOString());
    url.searchParams.set("limit", "1000");
    url.searchParams.set("order", "asc");
    if (startAfter) url.searchParams.set("start_after", startAfter);

    const path = `${url.pathname}${url.search}`;
    const data = await mercuryGet(path, token);
    transactions.push(...(data.transactions || []));
    startAfter = data.page?.nextPage || null;
  } while (startAfter);
  return transactions;
}

const MERCURY_EXPENSE_RULES = [
  {
    match: /WWW\.BRAVE\.COM/i,
    name: "Brave",
    category: "tools",
    url: "https://brave.com",
  },
  {
    match: /Google Workspace/i,
    name: "Google Workspace",
    category: "infra",
    url: "https://admin.google.com/ac/billing/subscriptions",
  },
  {
    match: /PAYPAL \*RFPMART LLC/i,
    name: "RFPMart LLC",
    category: "data",
    url: "https://www.paypal.com",
  },
  {
    match: /VERCEL MKT NEON/i,
    name: "Neon via Vercel",
    category: "infra",
    url: "https://vercel.com/marketplace/neon",
  },
  {
    match: /GOOGLE \*CLOUD/i,
    name: "Google Cloud",
    category: "infra",
    url: "https://console.cloud.google.com/billing",
  },
  {
    match: /ANTHROPIC/i,
    name: "Anthropic",
    category: "ai",
    url: "https://console.anthropic.com/settings/billing",
  },
  {
    match: /OPENAI \*CHATGPT SUBSCR/i,
    name: "ChatGPT Pro",
    category: "ai",
    url: "https://chatgpt.com",
    note: "Mercury actual; nominal $200 plan",
  },
  {
    match: /IDEOGRAM AI/i,
    name: "Ideogram",
    category: "ai",
    url: "https://ideogram.ai",
  },
  {
    match: /MAGIC PATTERNS/i,
    name: "Magic Patterns",
    category: "ai",
    url: "https://www.magicpatterns.com",
  },
  {
    match: /REPLICATE/i,
    name: "Replicate",
    category: "ai",
    url: "https://replicate.com",
  },
  {
    match: /CURSOR/i,
    name: "Cursor",
    category: "ai",
    url: "https://cursor.com/settings",
  },
];

function mercuryTxText(tx) {
  return [
    tx.counterpartyNickname,
    tx.counterpartyName,
    tx.bankDescription,
    tx.externalMemo,
    tx.note,
    tx.merchant?.category,
  ]
    .filter(Boolean)
    .join(" ");
}

function mercuryExpenseRule(tx) {
  const text = mercuryTxText(tx);
  return MERCURY_EXPENSE_RULES.find((rule) => rule.match.test(text));
}

function monthDisplay(label) {
  const [year, month] = label.split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function collectMercuryExpenses(range) {
  const token = process.env.MERCURY_API_TOKEN;
  if (!token) return { expenses: [], note: "Missing MERCURY_API_TOKEN" };

  const transactions = await listMercuryTransactions(range, token);
  const active = transactions.filter((t) =>
    !["cancelled", "failed", "reversed", "blocked"].includes(t.status),
  );
  const cardSpend = active.filter((t) => t.kind === "creditCardTransaction" && Number(t.amount) < 0);

  const byName = new Map();
  for (const tx of cardSpend) {
    const rule = mercuryExpenseRule(tx);
    if (!rule) continue;
    const existing = byName.get(rule.name) || {
      name: rule.name,
      cents: 0,
      category: rule.category,
      url: rule.url,
      note: rule.note || `Mercury actual ${monthDisplay(range.label)}`,
      count: 0,
    };
    existing.cents += Math.abs(dollarsToCents(tx.amount));
    existing.count += 1;
    byName.set(rule.name, existing);
  }

  const expenses = [...byName.values()].map(({ count, ...expense }) => ({
    ...expense,
    note:
      count > 1
        ? `${expense.note}; ${count} Mercury charges combined`
        : expense.note,
  }));

  return {
    expenses,
    note: `Matched ${expenses.length} Mercury expenses from ${cardSpend.length} card charges`,
  };
}

function mergeMercuryExpenses(subscriptions, mercuryExpenses) {
  if (!mercuryExpenses.length) return subscriptions;
  const byName = new Map((subscriptions || []).map((sub) => [sub.name, { ...sub }]));
  for (const expense of mercuryExpenses) {
    const current = byName.get(expense.name);
    byName.set(expense.name, {
      ...(current || {}),
      ...expense,
      cents: expense.cents,
    });
  }
  return [...byName.values()].sort((a, b) => (b.cents ?? -1) - (a.cents ?? -1));
}

// ── Recraft ──────────────────────────────────────────────────────
// Recraft has no public usage/billing API. Track manually via dashboard.
async function collectRecraft() {
  return { totalCents: null, note: "track manually at recraft.ai" };
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const range = monthRange();
  console.log(`Collecting money data for ${range.label}...`);

  let data;
  try {
    data = JSON.parse(readFileSync(OUT_PATH, "utf-8"));
  } catch {
    data = { lastUpdated: null, apiSpend: { months: [] }, subscriptions: [], domains: [] };
  }
  const originalData = cloneJson(data);
  if (!data.apiSpend) data.apiSpend = { months: [] };

  let month = data.apiSpend.months.find((m) => m.month === range.label);
  if (!month) {
    month = { month: range.label, collectedAt: null, services: {} };
    data.apiSpend.months.push(month);
  }
  const [vercel, anthropic, openai, neon, mercury, recraft] = await Promise.allSettled([
    collectVercel(range),
    collectAnthropic(range),
    collectOpenAI(range),
    collectNeon(month.services.neon),
    collectMercuryExpenses(range),
    collectRecraft(),
  ]);

  const unwrap = (r) =>
    r.status === "fulfilled"
      ? r.value
      : { totalCents: null, note: `Error: ${r.reason?.message || r.reason}` };

  month.services.vercel = unwrap(vercel);
  month.services.anthropic = unwrap(anthropic);
  month.services.openai = unwrap(openai);
  month.services.neon = unwrap(neon);
  month.services.recraft = unwrap(recraft);
  const mercuryResult = unwrap(mercury);
  if (mercuryResult.expenses) {
    data.subscriptions = mergeMercuryExpenses(data.subscriptions || [], mercuryResult.expenses);
  }

  data.apiSpend.months.sort((a, b) => a.month.localeCompare(b.month));

  const materialChanged = materialFingerprint(data) !== materialFingerprint(originalData);
  if (materialChanged) {
    month.collectedAt = new Date().toISOString();
    data.lastUpdated = month.collectedAt;
  } else {
    const originalMonth = originalData.apiSpend?.months?.find((m) => m.month === range.label);
    if (originalMonth?.collectedAt) month.collectedAt = originalMonth.collectedAt;
    data.lastUpdated = originalData.lastUpdated ?? data.lastUpdated ?? null;
    console.log("No material spend changes; preserving collected timestamps.");
  }

  writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWritten to ${OUT_PATH}`);

  // Summary
  console.log(`\n── API Spend: ${range.label} ──`);
  let totalTracked = 0;
  for (const [svc, entry] of Object.entries(month.services)) {
    if (entry.totalCents !== null) {
      totalTracked += entry.totalCents;
      console.log(`  ${svc.padEnd(14)} ${centsStr(entry.totalCents).padStart(9)}`);
      for (const b of entry.breakdown || []) {
        console.log(`    └─ ${b.name}: ${centsStr(b.cents)}`);
      }
    } else {
      console.log(`  ${svc.padEnd(14)}   manual  ${entry.note || ""}`);
    }
  }
  console.log(`\n  API total:     ${centsStr(totalTracked)}`);

  if (mercuryResult.note) console.log(`  Mercury:      ${mercuryResult.note}`);

  // Subs total
  const subsTotal = (data.subscriptions || []).reduce((s, x) => s + (x.cents || 0), 0);
  console.log(`  Subs total:    ${centsStr(subsTotal)}`);
  console.log(`  Monthly total: ${centsStr(totalTracked + subsTotal)}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
