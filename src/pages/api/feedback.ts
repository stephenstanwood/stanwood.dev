export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit } from "../../lib/rateLimit";

const WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  // 3 reports per IP per 10 minutes
  if (!rateLimit(ip, 3, 10 * 60_000)) {
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
