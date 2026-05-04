export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { okJson } from "../../lib/apiHelpers";

const WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // 3 reports per IP per 10 minutes
  if (!rateLimit(clientAddress, 3, 10 * 60_000)) return rateLimitResponse();

  let page = "unknown";
  let context = "";
  try {
    const body = await request.json();
    page = typeof body.page === "string" ? body.page.trim().slice(0, 100) : "unknown";
    context = typeof body.context === "string" ? body.context.trim().slice(0, 500) : "";
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

  return okJson({ ok: true });
};
