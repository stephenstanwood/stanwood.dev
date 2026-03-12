export const prerender = false;

// CLEANUP-FLAG: This file shares ~80% of its logic with nearby-fun.ts.
// The Places API fetch, field-mask building, progressive-search loop, and result
// mapping are near-identical. Consider extracting a shared searchNearbyPlaces()
// helper in lib/placesClient.ts to avoid drift between the two routes.

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { haversineMeters } from "../../lib/geo";

const PLACES_API_KEY = import.meta.env.GOOGLE_PLACES_API_KEY;

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  currentOpeningHours?: { openNow?: boolean };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  const { latitude, longitude } = await request.json();

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

  if (!PLACES_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Google Places API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.businessStatus",
    "places.currentOpeningHours",
  ].join(",");

  // Progressive search: try coffee first, then widen types and radius
  const searches = [
    { types: ["cafe", "coffee_shop"], radius: 3000 },
    { types: ["cafe", "coffee_shop"], radius: 8000 },
    { types: ["cafe", "coffee_shop", "restaurant", "fast_food_restaurant"], radius: 16000 },
  ];

  for (const search of searches) {
    const body = {
      includedTypes: search.types,
      maxResultCount: 10,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: search.radius,
        },
      },
    };

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      console.error("nearby-coffee Places API error:", res.status);
      return new Response(
        JSON.stringify({ error: "Unable to search nearby places" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const places = data.places || [];

    const results = (places as GooglePlace[])
      .filter(
        (p) => !p.businessStatus || p.businessStatus === "OPERATIONAL",
      )
      .map((p) => {
        const shopLat = p.location?.latitude ?? 0;
        const shopLng = p.location?.longitude ?? 0;
        const dist = haversineMeters(latitude, longitude, shopLat, shopLng);

        return {
          id: p.id,
          name: p.displayName?.text ?? "Unknown",
          address: p.formattedAddress ?? "",
          lat: shopLat,
          lng: shopLng,
          distance: Math.round(dist),
          rating: p.rating ?? null,
          ratingCount: p.userRatingCount ?? null,
          isOpen: p.currentOpeningHours?.openNow ?? null,
        };
      })
      .filter((p) => p.isOpen !== false)
      .sort((a, b) => a.distance - b.distance);

    if (results.length > 0) {
      return new Response(JSON.stringify({ results }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Nothing found even after widening
  return new Response(JSON.stringify({ results: [] }), {
    headers: { "Content-Type": "application/json" },
  });
};
