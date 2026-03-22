export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import type { ShowSwipeApiRequest, TmdbAction } from "../../lib/showSwipe/types";
import { errJson } from "../../lib/apiHelpers";

const TMDB_TOKEN = import.meta.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const VALID_ACTIONS = new Set<TmdbAction>([
  "trending", "discover", "now_playing", "tv_on_the_air", "videos",
]);

function buildTmdbUrl(
  action: TmdbAction,
  mediaType: "movie" | "tv",
  params: Record<string, string | number | boolean>,
): string {
  const qs = new URLSearchParams({ language: "en-US" });

  for (const [k, v] of Object.entries(params)) {
    if (k !== "id") qs.set(k, String(v));
  }

  switch (action) {
    case "trending":
      return `${TMDB_BASE}/trending/${mediaType}/week?${qs}`;
    case "now_playing":
      return `${TMDB_BASE}/movie/now_playing?${qs}`;
    case "tv_on_the_air":
      return `${TMDB_BASE}/tv/on_the_air?${qs}`;
    case "discover":
      return `${TMDB_BASE}/discover/${mediaType}?${qs}`;
    case "videos":
      return `${TMDB_BASE}/${mediaType}/${params.id}/videos?${qs}`;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  if (!TMDB_TOKEN) return errJson("TMDB API key not configured", 500);

  try {
    const body = (await request.json()) as ShowSwipeApiRequest;
    const { action, mediaType, params = {} } = body;

    if (!action || !mediaType) return errJson("action and mediaType are required", 400);
    if (mediaType !== "movie" && mediaType !== "tv") return errJson("mediaType must be 'movie' or 'tv'", 400);
    if (!VALID_ACTIONS.has(action)) return errJson(`Invalid action: ${action}`, 400);

    const url = buildTmdbUrl(action, mediaType, params);

    const tmdbRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!tmdbRes.ok) {
      console.error("TMDB API error:", tmdbRes.status);
      return errJson("Failed to fetch from TMDB", 502);
    }

    const data = await tmdbRes.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("show-swipe API error:", err);
    return errJson("Something went wrong", 500);
  }
};
