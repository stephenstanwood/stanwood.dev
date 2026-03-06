export const prerender = false;

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
  primaryType?: string;
}

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

  if (!PLACES_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Google Places API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const types = mode === "outside" ? OUTSIDE_TYPES : INSIDE_TYPES;

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.businessStatus",
    "places.currentOpeningHours",
    "places.primaryType",
  ].join(",");

  // Progressive search: try nearby first, then widen
  const searches = [
    { radius: 5000 },
    { radius: 12000 },
    { radius: 25000 },
  ];

  for (const search of searches) {
    const body = {
      includedTypes: types,
      maxResultCount: 10,
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
      console.error("nearby-fun Places API error:", res.status);
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
        const placeLat = p.location?.latitude ?? 0;
        const placeLng = p.location?.longitude ?? 0;
        const dist = haversineMeters(latitude, longitude, placeLat, placeLng);

        return {
          id: p.id,
          name: p.displayName?.text ?? "Unknown",
          address: p.formattedAddress ?? "",
          lat: placeLat,
          lng: placeLng,
          distance: Math.round(dist),
          rating: p.rating ?? null,
          ratingCount: p.userRatingCount ?? null,
          isOpen: p.currentOpeningHours?.openNow ?? null,
          primaryType: p.primaryType ?? null,
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

  return new Response(JSON.stringify({ results: [] }), {
    headers: { "Content-Type": "application/json" },
  });
};
