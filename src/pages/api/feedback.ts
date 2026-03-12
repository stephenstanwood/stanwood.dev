export const prerender = false;

import type { APIRoute } from "astro";

const WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;

// CLEANUP-FLAG: Custom rate limiter duplicates the pattern in lib/rateLimit.ts.
// rateLimit.ts uses different limits (200/min), so feedback intentionally uses
// tighter limits (3/10min). Consider parameterizing rateLimit() or exporting a
// factory so the implementation isn't duplicated.

// Simple in-memory rate limit: 3 reports per IP per 10 minutes
const hits = new Map<string, number[]>();
const MAX = 3;
const WINDOW = 10 * 60_000;

function allowed(ip: string): boolean {
  const now = Date.now();
  const ts = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (ts.length >= MAX) { hits.set(ip, ts); return false; }
  ts.push(now);
  hits.set(ip, ts);
  return true;
}

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!allowed(ip)) {
    return new Response(JSON.stringify({ ok: false }), { status: 429 });
  }

  let page = "unknown";
  let context = "";
  try {
    const body = await request.json();
    page = body.page || "unknown";
    context = body.context || "";
  } catch {}

  // Fire and forget — don't block the response on Discord
  if (WEBHOOK_URL) {
    const msg = `📢 **Feedback ping** from \`${page}\`\n${context ? `> ${context}\n` : ""}🕐 ${new Date().toISOString()}`;
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: msg }),
    }).catch(() => {});
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
