export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { fetchWithTimeout } from "../../lib/apiHelpers";

const MAPS_API_KEY = import.meta.env.GOOGLE_PLACES_API_KEY;

/**
 * Proxies Google Static Maps API requests so the API key stays server-side.
 * Accepts query params that map directly to the Static Maps API.
 */
export const GET: APIRoute = async ({ url, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  if (!MAPS_API_KEY) {
    return new Response("Maps API key not configured", { status: 500 });
  }

  // Allowlist of params to forward
  const allowed = [
    "center",
    "zoom",
    "size",
    "scale",
    "maptype",
    "markers",
    "style",
  ];

  const target = new URL(
    "https://maps.googleapis.com/maps/api/staticmap",
  );

  for (const key of allowed) {
    // markers and style can appear multiple times
    const values = url.searchParams.getAll(key);
    for (const v of values) {
      target.searchParams.append(key, v);
    }
  }

  // Append the API key (never sent to client)
  target.searchParams.set("key", MAPS_API_KEY);

  const res = await fetchWithTimeout(target.toString(), {}, 8000);

  if (!res.ok) {
    return new Response("Map image unavailable", {
      status: res.status,
    });
  }

  const body = await res.arrayBuffer();
  return new Response(body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};
