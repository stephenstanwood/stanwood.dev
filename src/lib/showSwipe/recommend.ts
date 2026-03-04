import type { MediaType, Era, TmdbMediaItem, ShowSwipeCard } from "./types";
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

// "recent" = current year + 2 prior (e.g. 2024-2026)
const RECENT_YEARS = 2;

function buildFetchPlan(totalSwipes: number, era: Era): FetchPlan[] {
  // "recent" mode: no classics, heavier on trending + now playing
  if (era === "recent") {
    if (totalSwipes < 10) {
      return [
        { source: "trending", weight: 0.55 },
        { source: "now_playing", weight: 0.45 },
      ];
    }
    if (totalSwipes < 50) {
      return [
        { source: "discover_personalized", weight: 0.45 },
        { source: "trending", weight: 0.30 },
        { source: "now_playing", weight: 0.25 },
      ];
    }
    return [
      { source: "discover_personalized", weight: 0.60 },
      { source: "trending", weight: 0.20 },
      { source: "now_playing", weight: 0.20 },
    ];
  }

  // "all" mode: includes classics
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
  era: Era,
  page: number,
): Promise<TmdbMediaItem[]> {
  const currentYear = new Date().getFullYear();
  const excluded = getExcludedGenreString(mediaType);
  const dateField =
    mediaType === "movie" ? "primary_release_date" : "first_air_date";

  switch (source) {
    case "trending":
      return (await fetchTrending(mediaType, page)).results;

    case "now_playing":
      return (await fetchNowPlaying(mediaType, page)).results;

    case "discover_personalized": {
      const genres = topGenres(3);
      const params: Record<string, string | number | boolean> = {
        sort_by: "popularity.desc",
        "vote_count.gte": 200,
        "vote_average.gte": 5.5,
        include_adult: false,
        without_genres: excluded,
        page,
      };
      if (genres.length > 0) {
        params.with_genres = genres.join(",");
      }
      // "recent" = last ~3 years; "all" = also last 3 years for personalized
      // (classics handle the older stuff in "all" mode)
      params[`${dateField}.gte`] = `${currentYear - RECENT_YEARS}-01-01`;
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

type SourceType = FetchPlan["source"];

function filterCandidates(
  rawItems: TmdbMediaItem[],
  allSeen: Set<number>,
  mediaType: MediaType,
  era: Era,
  source: SourceType,
): TmdbMediaItem[] {
  const currentYear = new Date().getFullYear();
  const recentCutoff = `${currentYear - RECENT_YEARS}-01-01`;

  // Trending/now_playing are already curated by TMDB — light filter only.
  // Discover needs stricter quality gates since we control the query.
  const isCurated = source === "trending" || source === "now_playing";

  return rawItems.filter((item) => {
    if (allSeen.has(item.id) || item.adult || !item.poster_path) return false;
    if (hasExcludedGenre(item, mediaType)) return false;

    if (isCurated) {
      // Only filter out truly garbage-rated content from trending
      if (item.vote_count >= 20 && item.vote_average < 3.0) return false;
    } else {
      // Stricter floor for discover results
      if (item.vote_count < 50 || item.vote_average < 5.0) return false;
    }

    // For "recent" mode, filter out older content from trending/now_playing
    if (era === "recent") {
      const dateStr =
        mediaType === "movie" ? item.release_date : item.first_air_date;
      if (dateStr && dateStr < recentCutoff) return false;
    }

    return true;
  });
}

export async function fetchNextBatch(
  mediaType: MediaType,
  era: Era,
  existingCardIds: Set<number>,
): Promise<ShowSwipeCard[]> {
  const seenIds = getSeenIds();
  const allSeen = new Set([...seenIds, ...existingCardIds]);
  const totalSwipes = getTotalSwipes();
  const plan = buildFetchPlan(totalSwipes, era);

  // Weighted random pick
  const roll = Math.random();
  let cumulative = 0;
  let chosenIdx = 0;
  for (let i = 0; i < plan.length; i++) {
    cumulative += plan[i].weight;
    if (roll <= cumulative) {
      chosenIdx = i;
      break;
    }
  }

  // Build source order: chosen first, then remaining sources as fallbacks
  const sourceOrder = [plan[chosenIdx], ...plan.filter((_, i) => i !== chosenIdx)];

  let candidates: TmdbMediaItem[] = [];

  for (const entry of sourceOrder) {
    // Try up to 5 pages per source, across a wider page range
    for (let pageAttempt = 0; pageAttempt < 5 && candidates.length < BUFFER_SIZE; pageAttempt++) {
      const page = Math.floor(Math.random() * 10) + 1;
      try {
        const rawItems = await fetchFromSource(entry.source, mediaType, era, page);
        const filtered = filterCandidates(rawItems, allSeen, mediaType, era, entry.source);
        // Add new candidates (dedup against what we already have)
        const existingIds = new Set(candidates.map((c) => c.id));
        for (const item of filtered) {
          if (!existingIds.has(item.id)) {
            candidates.push(item);
            existingIds.add(item.id);
          }
        }
        // If we got some results, move to next source (don't exhaust pages)
        if (filtered.length > 0) break;
      } catch {
        // Source failed, try next
        break;
      }
    }

    if (candidates.length >= BUFFER_SIZE) break;
  }

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
