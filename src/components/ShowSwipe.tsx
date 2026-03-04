import { useState, useEffect, useCallback, useRef } from "react";
import type {
  AppView,
  MediaType,
  ShowSwipeCard,
  SwipedItem,
  SwipeDirection,
} from "../lib/showSwipe/types";
import {
  recordSwipe,
  getMediaType,
  setMediaType as saveMediaType,
} from "../lib/showSwipe/storage";
import { fetchNextBatch } from "../lib/showSwipe/recommend";
import SwipeCard from "./show-swipe/SwipeCard";
import MediaToggle from "./show-swipe/MediaToggle";

const REFETCH_THRESHOLD = 3;

export default function ShowSwipe() {
  const [view, setView] = useState<AppView>("loading");
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [cards, setCards] = useState<ShowSwipeCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const aliveRef = useRef(true);

  // Load initial media type from storage
  useEffect(() => {
    setMediaType(getMediaType());
  }, []);

  // Fetch cards when media type changes
  const loadCards = useCallback(
    async (mt: MediaType) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setError(null);
      setView("loading");

      try {
        const batch = await fetchNextBatch(mt, new Set());
        if (!aliveRef.current) return;

        if (batch.length === 0) {
          setView("empty");
        } else {
          setCards(batch);
          setView("swiping");
        }
      } catch (err) {
        if (!aliveRef.current) return;
        console.error("Failed to load cards:", err);
        setError("Could not load trailers. Please try again.");
        setView("error");
      } finally {
        fetchingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    aliveRef.current = true;
    loadCards(mediaType);
    return () => {
      aliveRef.current = false;
    };
  }, [mediaType, loadCards]);

  // Fetch more cards in background when buffer runs low
  const maybeFetchMore = useCallback(
    async (currentCards: ShowSwipeCard[], mt: MediaType) => {
      if (fetchingRef.current || currentCards.length >= REFETCH_THRESHOLD) return;
      fetchingRef.current = true;
      try {
        const existingIds = new Set(currentCards.map((c) => c.tmdbId));
        const batch = await fetchNextBatch(mt, existingIds);
        if (!aliveRef.current) return;
        setCards((prev) => {
          const ids = new Set(prev.map((c) => c.tmdbId));
          const fresh = batch.filter((c) => !ids.has(c.tmdbId));
          return [...prev, ...fresh];
        });
      } catch {
        // Silent fail — user still has cards to swipe
      } finally {
        fetchingRef.current = false;
      }
    },
    [],
  );

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      setCards((prev) => {
        const current = prev[0];
        if (!current) return prev;

        const item: SwipedItem = {
          tmdbId: current.tmdbId,
          mediaType: current.mediaType,
          title: current.title,
          genreIds: current.genreIds,
          voteAverage: current.voteAverage,
          timestamp: Date.now(),
        };
        recordSwipe(item, direction);

        const remaining = prev.slice(1);

        if (remaining.length === 0) {
          setView("loading");
          fetchingRef.current = false;
          fetchNextBatch(mediaType, new Set())
            .then((batch) => {
              if (!aliveRef.current) return;
              if (batch.length === 0) {
                setView("empty");
              } else {
                setCards(batch);
                setView("swiping");
              }
            })
            .catch(() => {
              if (!aliveRef.current) return;
              setView("empty");
            });
        } else {
          maybeFetchMore(remaining, mediaType);
        }

        return remaining;
      });
    },
    [mediaType, maybeFetchMore],
  );

  const handleMediaToggle = useCallback(
    (mt: MediaType) => {
      setMediaType(mt);
      saveMediaType(mt);
      setCards([]);
    },
    [],
  );

  // Keyboard controls
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (view !== "swiping" || cards.length === 0) return;
      if (e.key === "ArrowLeft") handleSwipe("left");
      if (e.key === "ArrowRight") handleSwipe("right");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, cards.length, handleSwipe]);

  return (
    <div className="ss-app">
      <MediaToggle value={mediaType} onChange={handleMediaToggle} />

      <div className="ss-card-area">
        {view === "loading" && (
          <div className="ss-loading">
            <div className="ss-spinner" />
            <p className="ss-loading-text">Finding trailers...</p>
          </div>
        )}

        {view === "error" && (
          <div className="ss-error-state">
            <p className="ss-error">{error}</p>
            <button
              className="ss-btn ss-btn-retry"
              onClick={() => loadCards(mediaType)}
            >
              Try again
            </button>
          </div>
        )}

        {view === "empty" && (
          <div className="ss-empty-state">
            <p className="ss-empty-text">
              No more trailers right now. Check back soon!
            </p>
            <button
              className="ss-btn ss-btn-retry"
              onClick={() => loadCards(mediaType)}
            >
              Refresh
            </button>
          </div>
        )}

        {view === "swiping" && cards.length > 0 && (
          <SwipeCard
            key={cards[0].tmdbId}
            card={cards[0]}
            onSwipe={handleSwipe}
            active
          />
        )}
      </div>

      {view === "swiping" && (
        <p className="ss-hint">
          swipe or use arrow keys
        </p>
      )}
    </div>
  );
}
