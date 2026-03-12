export const prerender = false;

// CLEANUP-FLAG: This file shares ~80% of its logic with nearby-coffee.ts.
// The Places API fetch, field-mask building, progressive-search loop, and result
// mapping are near-identical. Consider extracting a shared searchNearbyPlaces()
// helper in lib/placesClient.ts to avoid drift between the two routes.

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { validatePlacesKey, searchNearbyPlaces } from "../../lib/placesClient";

// Inside (rainy day) — museums, libraries, bowling, movies, aquariums, indoor play
const INSIDE_TYPES = [
  "museum",
  "aquarium",
  "bowling_alley",
  "movie_theater",
  "library",
  "community_center",
  "cultural_center",
  "art_gallery",
];

// Outside (sunny day) — parks, playgrounds, zoos, gardens, water parks
const OUTSIDE_TYPES = [
  "park",
  "playground",
  "zoo",
  "amusement_park",
  "national_park",
];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  const { latitude, longitude, mode } = await request.json();

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return new Response(
      JSON.stringify({ error: "valid latitude and longitude are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const keyError = validatePlacesKey();
  if (keyError) return keyError;

  const types = mode === "outside" ? OUTSIDE_TYPES : INSIDE_TYPES;

  const { results, error } = await searchNearbyPlaces({
    latitude,
    longitude,
    steps: [
      { types, radius: 5000 },
      { types, radius: 12000 },
      { types, radius: 25000 },
    ],
    extraFields: ["places.primaryType"],
    mapExtra: (p) => ({ primaryType: p.primaryType ?? null }),
  });

  if (error) return error;

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
};
