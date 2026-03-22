export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { validatePlacesKey, searchNearbyPlaces } from "../../lib/placesClient";
import { errJson } from "../../lib/apiHelpers";

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  let latitude: unknown, longitude: unknown;
  try {
    ({ latitude, longitude } = await request.json());
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

  const { results, error } = await searchNearbyPlaces({
    latitude,
    longitude,
    steps: [
      { types: ["cafe", "coffee_shop"], radius: 3000 },
      { types: ["cafe", "coffee_shop"], radius: 8000 },
      { types: ["cafe", "coffee_shop", "restaurant", "fast_food_restaurant"], radius: 16000 },
    ],
  });

  if (error) return error;

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
};
