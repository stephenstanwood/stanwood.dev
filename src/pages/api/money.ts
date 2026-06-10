import type { APIRoute } from "astro";
import money from "../../data/money.json";
import { okJson } from "../../lib/apiHelpers";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";

// Auth is enforced by middleware; if execution reaches here, the request is authorized.
export const prerender = false;

export const GET: APIRoute = ({ clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();
  return okJson(money, { "Cache-Control": "private, no-store" });
};
