import type { APIRoute } from "astro";
import { okJson } from "../../../lib/apiHelpers";
import { loadReplayFeed } from "../../../lib/tvReplaysServer";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";

export const prerender = false;
export const GET: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();
  return okJson(await loadReplayFeed(), { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600" });
};
