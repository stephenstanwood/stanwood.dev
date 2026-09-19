const SHARED_GENRES: Record<number, string> = {
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  9648: "Mystery",
  37: "Western",
};

const MOVIE_GENRES: Record<number, string> = {
  ...SHARED_GENRES,
  28: "Action",
  12: "Adventure",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
};

const TV_GENRES: Record<number, string> = {
  ...SHARED_GENRES,
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export function resolveGenreNames(
  genreIds: number[],
  mediaType: "movie" | "tv",
): string[] {
  const map = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
  return genreIds.map((id) => map[id]).filter(Boolean);
}
