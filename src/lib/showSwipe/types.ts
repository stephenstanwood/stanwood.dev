// ─── Media Types ────────────────────────────────────────────────────────────

export type MediaType = "movie" | "tv";
export type Era = "recent" | "all";

// ─── TMDB Response Shapes ───────────────────────────────────────────────────

export interface TmdbMediaItem {
  id: number;
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  // movie-specific
  title?: string;
  original_title?: string;
  release_date?: string;
  // tv-specific
  name?: string;
  original_name?: string;
  first_air_date?: string;
}

export interface TmdbVideoResult {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TmdbVideosResponse {
  id: number;
  results: TmdbVideoResult[];
}

export interface TmdbDiscoverResponse {
  page: number;
  results: TmdbMediaItem[];
  total_pages: number;
  total_results: number;
}

// ─── App Data ───────────────────────────────────────────────────────────────

export interface ShowSwipeCard {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  genreIds: number[];
  genreNames: string[];
  youtubeKey: string;
  trailerName: string;
  originalLanguage: string;
}

// ─── Swipe State ────────────────────────────────────────────────────────────

export type SwipeDirection = "left" | "right";

export interface SwipedItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  genreIds: number[];
  voteAverage: number;
  timestamp: number;
}

// ─── Storage ────────────────────────────────────────────────────────────────

export interface ShowSwipeStorage {
  version: 1;
  liked: SwipedItem[];
  disliked: SwipedItem[];
  genreScores: Record<number, number>;
  seenIds: number[];
  mediaType: MediaType;
  era: Era;
  lastUpdated: string;
}

// ─── API ────────────────────────────────────────────────────────────────────

export type TmdbAction =
  | "trending"
  | "discover"
  | "now_playing"
  | "tv_on_the_air"
  | "videos";

export interface ShowSwipeApiRequest {
  action: TmdbAction;
  mediaType: MediaType;
  params?: Record<string, string | number | boolean>;
}

// ─── App View State ─────────────────────────────────────────────────────────

export type AppView = "loading" | "swiping" | "error" | "empty";
