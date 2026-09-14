/**
 * Photo fetching utilities for Green Light recommendations.
 * Google Places photos with Pexels fallback.
 */

import { pickRandom, shuffle } from "./arrays";
import { fetchWithTimeout } from "./apiHelpers";

export async function fetchRestaurantPhotos(
  restaurant: string,
  location: string,
  placesKey: string,
): Promise<string[]> {
  if (!placesKey) return [];
  try {
    const searchRes = await fetchWithTimeout(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": placesKey,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({
          textQuery: `${restaurant} restaurant ${location}`,
          maxResultCount: 1,
        }),
      },
      4000,
    );
    if (!searchRes.ok) return [];
    const data = await searchRes.json();
    const photos: Array<{ name: string }> = data.places?.[0]?.photos ?? [];
    if (photos.length === 0) return [];

    // Pick 2 random photos from the top results for variety
    const selected = shuffle(photos.slice(0, 6)).slice(0, 2);

    const urls = await Promise.all(
      selected.map(async (photo) => {
        try {
          const photoRes = await fetchWithTimeout(
            `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&skipHttpRedirect=true&key=${placesKey}`,
            {},
            3000,
          );
          if (!photoRes.ok) return null;
          const photoData = await photoRes.json();
          return photoData.photoUri ?? null;
        } catch {
          return null;
        }
      }),
    );
    return urls.filter((url): url is string => url !== null);
  } catch (err) {
    console.error("fetchRestaurantPhotos error:", err);
    return [];
  }
}

export async function fetchPexelsPhoto(
  query: string,
  pexelsKey: string,
): Promise<string | null> {
  if (!pexelsKey) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food")}&per_page=3&orientation=landscape`,
      { headers: { Authorization: pexelsKey } },
      3000,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = pickRandom<{ src: { medium: string } }>(data.photos ?? []);
    return photo?.src.medium ?? null;
  } catch (err) {
    console.error("fetchPexelsPhoto error:", err);
    return null;
  }
}
