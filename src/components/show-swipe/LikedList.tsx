import { useState, useCallback } from "react";
import type { SwipedItem } from "../../lib/showSwipe/types";
import { getLiked, removeLiked } from "../../lib/showSwipe/storage";
import { resolveGenreNames } from "../../lib/showSwipe/genres";

interface Props {
  onBack: () => void;
}

export default function LikedList({ onBack }: Props) {
  const [items, setItems] = useState<SwipedItem[]>(() => getLiked());

  const handleRemove = useCallback((tmdbId: number) => {
    removeLiked(tmdbId);
    setItems((prev) => prev.filter((i) => i.tmdbId !== tmdbId));
  }, []);

  return (
    <div className="ss-liked">
      <div className="ss-liked-header">
        <button className="ss-liked-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <h2 className="ss-liked-title">Liked</h2>
        <span className="ss-liked-count">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="ss-liked-empty">
          <p>Nothing here yet.</p>
          <p className="ss-liked-empty-hint">Swipe right on trailers you like and they'll show up here.</p>
        </div>
      ) : (
        <ul className="ss-liked-list">
          {items.map((item) => {
            const genres = resolveGenreNames(item.genreIds, item.mediaType).slice(0, 2);
            return (
              <li key={item.tmdbId} className="ss-liked-item">
                <div className="ss-liked-info">
                  <span className="ss-liked-item-title">{item.title}</span>
                  <span className="ss-liked-item-meta">
                    {"★"} {item.voteAverage.toFixed(1)}
                    {genres.length > 0 && ` · ${genres.join(", ")}`}
                    {" · "}
                    {item.mediaType === "tv" ? "TV" : "Movie"}
                  </span>
                </div>
                <button
                  className="ss-liked-remove"
                  onClick={() => handleRemove(item.tmdbId)}
                  aria-label={`Remove ${item.title}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
