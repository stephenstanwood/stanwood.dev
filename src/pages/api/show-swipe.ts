export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import type { ShowSwipeApiRequest, TmdbAction } from "../../lib/showSwipe/types";

const TMDB_TOKEN = import.meta.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

// CLEANUP-FLAG: ~20 instances of `new Response(JSON.stringify({ error }), { status, headers })` spread across
// api routes. A shared errJson(msg, status) helper in lib/ would reduce this significantly.

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

  if (!TMDB_TOKEN) {
    return new Response(
      JSON.stringify({ error: "TMDB API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = (await request.json()) as ShowSwipeApiRequest;
    const { action, mediaType, params = {} } = body;

    if (!action || !mediaType) {
      return new Response(
        JSON.stringify({ error: "action and mediaType are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (mediaType !== "movie" && mediaType !== "tv") {
      return new Response(
        JSON.stringify({ error: "mediaType must be 'movie' or 'tv'" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!VALID_ACTIONS.has(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action: ${action}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = buildTmdbUrl(action, mediaType, params);

    const tmdbRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!tmdbRes.ok) {
      console.error("TMDB API error:", tmdbRes.status);
      return new Response(
        JSON.stringify({ error: "Failed to fetch from TMDB" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
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
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
