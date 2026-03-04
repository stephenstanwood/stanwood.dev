import type { MediaType, TmdbMediaItem, ShowSwipeCard } from "./types";
import { getSeenIds, getGenreScores, getTotalSwipes } from "./storage";
import {
  fetchTrending,
  fetchNowPlaying,
  fetchDiscover,
  resolveCard,
} from "./tmdbClient";

const BUFFER_SIZE = 8;

// TV genre IDs to exclude: Talk, News, Reality, Soap
// Reality (10764) covers competition shows like The Voice, Survivor, etc.
const EXCLUDED_TV_GENRES = new Set([10767, 10763, 10764, 10766]);
// Movie genre IDs to exclude: TV Movie
const EXCLUDED_MOVIE_GENRES = new Set([10770]);

function getExcludedGenres(mediaType: MediaType): Set<number> {
  return mediaType === "tv" ? EXCLUDED_TV_GENRES : EXCLUDED_MOVIE_GENRES;
}

function getExcludedGenreString(mediaType: MediaType): string {
  return [...getExcludedGenres(mediaType)].join(",");
}

interface FetchPlan {
  source: "trending" | "now_playing" | "discover_personalized" | "discover_classic";
  weight: number;
}

function buildFetchPlan(totalSwipes: number): FetchPlan[] {
  if (totalSwipes < 10) {
    return [
      { source: "trending", weight: 0.5 },
      { source: "now_playing", weight: 0.3 },
      { source: "discover_classic", weight: 0.2 },
    ];
  }
  if (totalSwipes < 50) {
    return [
      { source: "discover_personalized", weight: 0.4 },
      { source: "trending", weight: 0.3 },
      { source: "now_playing", weight: 0.2 },
      { source: "discover_classic", weight: 0.1 },
    ];
  }
  return [
    { source: "discover_personalized", weight: 0.6 },
    { source: "trending", weight: 0.15 },
    { source: "now_playing", weight: 0.15 },
    { source: "discover_classic", weight: 0.1 },
  ];
}

function topGenres(n: number): number[] {
  const scores = getGenreScores();
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .filter(([, score]) => score > 0)
    .map(([id]) => Number(id));
}

async function fetchFromSource(
  source: FetchPlan["source"],
  mediaType: MediaType,
  page: number,
): Promise<TmdbMediaItem[]> {
  const currentYear = new Date().getFullYear();
  const excluded = getExcludedGenreString(mediaType);

  switch (source) {
    case "trending":
      return (await fetchTrending(mediaType, page)).results;

    case "now_playing":
      return (await fetchNowPlaying(mediaType, page)).results;

    case "discover_personalized": {
      const genres = topGenres(3);
      const params: Record<string, string | number | boolean> = {
        sort_by: "popularity.desc",
        "vote_count.gte": 50,
        include_adult: false,
        without_genres: excluded,
        page,
      };
      if (genres.length > 0) {
        params.with_genres = genres.join(",");
      }
      const dateField =
        mediaType === "movie" ? "primary_release_date" : "first_air_date";
      params[`${dateField}.gte`] = `${currentYear - 3}-01-01`;
      return (await fetchDiscover(mediaType, params)).results;
    }

    case "discover_classic": {
      const params: Record<string, string | number | boolean> = {
        sort_by: "vote_average.desc",
        "vote_count.gte": 1000,
        "vote_average.gte": 7.5,
        include_adult: false,
        without_genres: excluded,
        page: Math.floor(Math.random() * 5) + 1,
      };
      const dateField =
        mediaType === "movie" ? "primary_release_date" : "first_air_date";
      params[`${dateField}.lte`] = `${currentYear - 10}-12-31`;
      return (await fetchDiscover(mediaType, params)).results;
    }
  }
}

/** Returns true if the item has any excluded genre */
function hasExcludedGenre(item: TmdbMediaItem, mediaType: MediaType): boolean {
  const excluded = getExcludedGenres(mediaType);
  return item.genre_ids.some((id) => excluded.has(id));
}

export async function fetchNextBatch(
  mediaType: MediaType,
  existingCardIds: Set<number>,
): Promise<ShowSwipeCard[]> {
  const seenIds = getSeenIds();
  const allSeen = new Set([...seenIds, ...existingCardIds]);
  const totalSwipes = getTotalSwipes();
  const plan = buildFetchPlan(totalSwipes);

  const roll = Math.random();
  let cumulative = 0;
  let chosenSource = plan[0];
  for (const entry of plan) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      chosenSource = entry;
      break;
    }
  }

  const page = Math.floor(Math.random() * 3) + 1;
  const rawItems = await fetchFromSource(chosenSource.source, mediaType, page);

  // Filter: not seen, not adult, has poster, no excluded genres
  const candidates = rawItems.filter(
    (item) =>
      !allSeen.has(item.id) &&
      !item.adult &&
      item.poster_path &&
      !hasExcludedGenre(item, mediaType),
  );

  const shuffled = candidates.sort(() => Math.random() - 0.5);

  const batch = shuffled.slice(0, BUFFER_SIZE + 4);
  const results = await Promise.allSettled(
    batch.map((item) => resolveCard(item, mediaType)),
  );

  const resolved: ShowSwipeCard[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      resolved.push(result.value);
      if (resolved.length >= BUFFER_SIZE) break;
    }
  }

  return resolved;
}
