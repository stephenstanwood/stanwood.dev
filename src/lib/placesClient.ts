/**
 * Shared Google Places API helper.
 * Used by the nearby-coffee API route to dedupe search logic.
 */

import { haversineMeters } from "./geo";
import { errJson } from "./apiHelpers";

const PLACES_API_KEY = import.meta.env.GOOGLE_PLACES_API_KEY;

export interface GooglePlace {
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

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  rating: number | null;
  ratingCount: number | null;
  isOpen: boolean | null;
  primaryType?: string | null;
}

export interface SearchStep {
  types: string[];
  radius: number;
}

interface SearchOptions {
  latitude: number;
  longitude: number;
  steps: SearchStep[];
  /** Extra fields beyond the base set (e.g. "places.primaryType") */
  extraFields?: string[];
  /** Extra properties to include in each result from the raw place */
  mapExtra?: (p: GooglePlace) => Record<string, unknown>;
}

const BASE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.currentOpeningHours",
];

/**
 * Validate that the API key is configured. Returns an error Response or null.
 */
export function validatePlacesKey(): Response | null {
  if (!PLACES_API_KEY) {
    return errJson("Google Places API key not configured", 500);
  }
  return null;
}

/**
 * Progressive nearby search — tries each step in order, returns
 * results as soon as any step produces matches.
 */
export async function searchNearbyPlaces(
  opts: SearchOptions,
): Promise<{ results?: PlaceResult[]; error?: Response }> {
  const { latitude, longitude, steps, extraFields = [], mapExtra } = opts;

  const fieldMask = [...BASE_FIELDS, ...extraFields].join(",");

  for (const step of steps) {
    const body = {
      includedTypes: step.types,
      maxResultCount: 10,
      ...(step.types.length <= 3 ? { rankPreference: "DISTANCE" } : {}),
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: step.radius,
        },
      },
    };

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY!,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      console.error("Places API error:", res.status);
      return { error: errJson("Unable to search nearby places", 502) };
    }

    const data = await res.json();
    const places = (data.places || []) as GooglePlace[];

    const results: PlaceResult[] = places
      .filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
      .map((p) => {
        const pLat = p.location?.latitude ?? 0;
        const pLng = p.location?.longitude ?? 0;
        const dist = haversineMeters(latitude, longitude, pLat, pLng);

        return {
          id: p.id,
          name: p.displayName?.text ?? "Unknown",
          address: p.formattedAddress ?? "",
          lat: pLat,
          lng: pLng,
          distance: Math.round(dist),
          rating: p.rating ?? null,
          ratingCount: p.userRatingCount ?? null,
          isOpen: p.currentOpeningHours?.openNow ?? null,
          ...(mapExtra ? mapExtra(p) : {}),
        };
      })
      .filter((p) => p.isOpen !== false)
      .sort((a, b) => a.distance - b.distance);

    if (results.length > 0) {
      return { results };
    }
  }

  return { results: [] };
}
