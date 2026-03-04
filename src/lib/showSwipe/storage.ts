import type { ShowSwipeStorage, SwipedItem, MediaType, Era } from "./types";

const LS_KEY = "show-swipe:v1";
const MAX_HISTORY = 200;
const MAX_SEEN = 2000;

function getDefault(): ShowSwipeStorage {
  return {
    version: 1,
    liked: [],
    disliked: [],
    genreScores: {},
    seenIds: [],
    mediaType: "tv",
    era: "recent",
    lastUpdated: new Date().toISOString(),
  };
}

export function loadStorage(): ShowSwipeStorage | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ShowSwipeStorage;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

function save(data: ShowSwipeStorage): void {
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export function recordSwipe(
  item: SwipedItem,
  direction: "left" | "right",
): void {
  const stored = loadStorage() ?? getDefault();

  if (direction === "right") {
    stored.liked = [item, ...stored.liked].slice(0, MAX_HISTORY);
    for (const gid of item.genreIds) {
      stored.genreScores[gid] = (stored.genreScores[gid] ?? 0) + 1;
    }
  } else {
    stored.disliked = [item, ...stored.disliked].slice(0, MAX_HISTORY);
    for (const gid of item.genreIds) {
      stored.genreScores[gid] = (stored.genreScores[gid] ?? 0) - 0.5;
    }
  }

  if (!stored.seenIds.includes(item.tmdbId)) {
    stored.seenIds = [...stored.seenIds, item.tmdbId].slice(-MAX_SEEN);
  }

  save(stored);
}

export function getSeenIds(): Set<number> {
  const stored = loadStorage();
  return new Set(stored?.seenIds ?? []);
}

export function getGenreScores(): Record<number, number> {
  return loadStorage()?.genreScores ?? {};
}

export function getMediaType(): MediaType {
  return loadStorage()?.mediaType ?? "tv";
}

export function setMediaType(mt: MediaType): void {
  const stored = loadStorage() ?? getDefault();
  stored.mediaType = mt;
  save(stored);
}

export function getEra(): Era {
  return loadStorage()?.era ?? "recent";
}

export function setEra(era: Era): void {
  const stored = loadStorage() ?? getDefault();
  stored.era = era;
  save(stored);
}

export function getTotalSwipes(): number {
  const stored = loadStorage();
  return (stored?.liked?.length ?? 0) + (stored?.disliked?.length ?? 0);
}

export function getLiked(): SwipedItem[] {
  return loadStorage()?.liked ?? [];
}

export function removeLiked(tmdbId: number): void {
  const stored = loadStorage() ?? getDefault();
  const item = stored.liked.find((i) => i.tmdbId === tmdbId);
  if (item) {
    // Reverse the genre score boost
    for (const gid of item.genreIds) {
      stored.genreScores[gid] = (stored.genreScores[gid] ?? 0) - 1;
    }
  }
  stored.liked = stored.liked.filter((i) => i.tmdbId !== tmdbId);
  save(stored);
}
