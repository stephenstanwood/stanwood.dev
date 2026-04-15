export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import type { TmdbAction } from "../../lib/showSwipe/types";
import { errJson, devErrJson, okJson, fetchWithTimeout, toErrMsg } from "../../lib/apiHelpers";

const TMDB_TOKEN = import.meta.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const VALID_ACTIONS = new Set<TmdbAction>([
  "trending", "discover", "now_playing", "tv_on_the_air", "videos",
]);

// Cache for repeated identical TMDB URL builds (e.g. multiple cards requesting same discover params)
const urlCache = new Map<string, string>();
const URL_CACHE_MAX = 50;

function buildTmdbUrl(
  action: TmdbAction,
  mediaType: "movie" | "tv",
  params: Record<string, string | number | boolean>,
): string {
  const cacheKey = `${action}:${mediaType}:${JSON.stringify(params)}`;
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;

  const qs = new URLSearchParams({ language: "en-US" });
  for (const [key, val] of Object.entries(params)) {
    if (key !== "id") qs.set(key, String(val));
  }

  let url: string;
  switch (action) {
    case "trending":
      url = `${TMDB_BASE}/trending/${mediaType}/week?${qs}`;
      break;
    case "now_playing":
      url = `${TMDB_BASE}/movie/now_playing?${qs}`;
      break;
    case "tv_on_the_air":
      url = `${TMDB_BASE}/tv/on_the_air?${qs}`;
      break;
    case "discover":
      url = `${TMDB_BASE}/discover/${mediaType}?${qs}`;
      break;
    case "videos":
      url = `${TMDB_BASE}/${mediaType}/${params.id}/videos?${qs}`;
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  // Safe: size >= URL_CACHE_MAX guarantees at least one entry exists
  if (urlCache.size >= URL_CACHE_MAX) urlCache.delete(urlCache.keys().next().value!);
  urlCache.set(cacheKey, url);
  return url;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  if (!TMDB_TOKEN) return errJson("TMDB API key not configured", 500);

  try {
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : null;
    const mediaType = typeof body?.mediaType === "string" ? body.mediaType : null;
    const params =
      body?.params && typeof body.params === "object" && !Array.isArray(body.params)
        ? (body.params as Record<string, string | number | boolean>)
        : {};

    if (!action || !mediaType) return errJson("action and mediaType are required", 400);
    if (mediaType !== "movie" && mediaType !== "tv") return errJson("mediaType must be 'movie' or 'tv'", 400);
    if (!VALID_ACTIONS.has(action as TmdbAction)) return errJson(`Invalid action: ${action}`, 400);

    const url = buildTmdbUrl(action as TmdbAction, mediaType, params);

    const tmdbRes = await fetchWithTimeout(url, {
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
    return okJson(data, { "Cache-Control": "public, max-age=300" });
  } catch (err) {
    console.error("show-swipe API error:", err);
    return devErrJson("Something went wrong", toErrMsg(err));
  }
};
