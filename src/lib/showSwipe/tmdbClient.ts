import type {
  MediaType,
  TmdbMediaItem,
  TmdbVideoResult,
  TmdbDiscoverResponse,
  TmdbVideosResponse,
  ShowSwipeCard,
} from "./types";
import { resolveGenreNames } from "./genres";

const API_URL = "/api/show-swipe";

async function tmdbFetch<T>(
  action: string,
  mediaType: MediaType,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, mediaType, params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `API error ${res.status}`);
  }
  return res.json();
}

export async function fetchTrending(
  mediaType: MediaType,
  page = 1,
): Promise<TmdbDiscoverResponse> {
  return tmdbFetch("trending", mediaType, { page });
}

export async function fetchNowPlaying(
  mediaType: MediaType,
  page = 1,
): Promise<TmdbDiscoverResponse> {
  const action = mediaType === "movie" ? "now_playing" : "tv_on_the_air";
  return tmdbFetch(action, mediaType, { page });
}

export async function fetchDiscover(
  mediaType: MediaType,
  params: Record<string, string | number | boolean>,
): Promise<TmdbDiscoverResponse> {
  return tmdbFetch("discover", mediaType, params);
}

export async function fetchTrailer(
  tmdbId: number,
  mediaType: MediaType,
): Promise<TmdbVideoResult | null> {
  const data = await tmdbFetch<TmdbVideosResponse>("videos", mediaType, {
    id: tmdbId,
  });
  const videos = data.results ?? [];

  // Priority: official YouTube trailer > any trailer > teaser > any YouTube
  const official = videos.find(
    (v) => v.site === "YouTube" && v.type === "Trailer" && v.official,
  );
  if (official) return official;

  const trailer = videos.find(
    (v) => v.site === "YouTube" && v.type === "Trailer",
  );
  if (trailer) return trailer;

  const teaser = videos.find(
    (v) => v.site === "YouTube" && v.type === "Teaser",
  );
  if (teaser) return teaser;

  return videos.find((v) => v.site === "YouTube") ?? null;
}

export async function resolveCard(
  item: TmdbMediaItem,
  mediaType: MediaType,
): Promise<ShowSwipeCard | null> {
  const trailer = await fetchTrailer(item.id, mediaType);
  if (!trailer) return null;

  const title =
    mediaType === "movie"
      ? (item.title ?? item.original_title ?? "Unknown")
      : (item.name ?? item.original_name ?? "Unknown");

  const dateStr =
    mediaType === "movie" ? item.release_date : item.first_air_date;
  const year = dateStr ? dateStr.slice(0, 4) : "????";

  return {
    tmdbId: item.id,
    mediaType,
    title,
    year: mediaType === "tv" ? `${year}\u2013` : year,
    overview: item.overview,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    voteAverage: Math.round(item.vote_average * 10) / 10,
    genreIds: item.genre_ids,
    genreNames: resolveGenreNames(item.genre_ids, mediaType),
    youtubeKey: trailer.key,
    trailerName: trailer.name,
    originalLanguage: item.original_language,
  };
}
