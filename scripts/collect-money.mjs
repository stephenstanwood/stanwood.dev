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

  // Include both Usage (pay-as-you-go) AND Purchase (Pro subscription base fee)
  const byService = {};
  for (const c of charges) {
    if (c.ChargeCategory !== "Usage" && c.ChargeCategory !== "Purchase") continue;
    const name = c.ServiceName || "Other";
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
  const url = new URL("https://api.anthropic.com/v1/organizations/usage_report/messages");
  url.searchParams.set("starting_at", range.from.toISOString());
  url.searchParams.set("ending_at", range.to.toISOString());
  url.searchParams.append("group_by[]", "model");
  url.searchParams.append("group_by[]", "api_key_id");

  const res = await fetch(url, {
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { totalCents: null, note: `Anthropic API ${res.status}: ${body.slice(0, 200)}` };
  }

  const data = await res.json();

  // Aggregate by model, compute cost manually
  const byModel = {};
  let unknownTokens = 0;
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

  let totalCents = 0;
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

  return {
    totalCents,
    breakdown: filtered,
    note: "computed from API key token usage (excludes Claude Code on Max)",
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
      const dollars = result.amount?.value || 0;
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
  if (!data.apiSpend) data.apiSpend = { months: [] };

  let month = data.apiSpend.months.find((m) => m.month === range.label);
  if (!month) {
    month = { month: range.label, collectedAt: null, services: {} };
    data.apiSpend.months.push(month);
  }

  const [vercel, anthropic, openai] = await Promise.allSettled([
    collectVercel(range),
    collectAnthropic(range),
    collectOpenAI(range),
  ]);

  const unwrap = (r) =>
    r.status === "fulfilled"
      ? r.value
      : { totalCents: null, note: `Error: ${r.reason?.message || r.reason}` };

  month.services.vercel = unwrap(vercel);
  month.services.anthropic = unwrap(anthropic);
  month.services.openai = unwrap(openai);

  month.collectedAt = new Date().toISOString();
  data.lastUpdated = month.collectedAt;
  data.apiSpend.months.sort((a, b) => a.month.localeCompare(b.month));

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

  // Subs total
  const subsTotal = (data.subscriptions || []).reduce((s, x) => s + (x.cents || 0), 0);
  console.log(`  Subs total:    ${centsStr(subsTotal)}`);
  console.log(`  Monthly total: ${centsStr(totalTracked + subsTotal)}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
