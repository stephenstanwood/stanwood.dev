export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { validatePlacesKey, searchNearbyPlaces } from "../../lib/placesClient";
import { errJson } from "../../lib/apiHelpers";

// Inside (rainy day) — museums, libraries, bowling, aquariums, indoor play
// movie_theater excluded: "open" doesn't mean showtimes are running
const INSIDE_TYPES = [
  "museum",
  "aquarium",
  "bowling_alley",
  "library",
  "community_center",
  "cultural_center",
  "art_gallery",
  "indoor_playground",
  "toy_store",
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

  let latitude: unknown, longitude: unknown, mode: unknown;
  try {
    ({ latitude, longitude, mode } = await request.json());
  } catch {
    return errJson("invalid request body", 400);
  }

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return errJson("valid latitude and longitude are required", 400);
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
