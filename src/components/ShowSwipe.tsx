import { useState, useEffect, useCallback, useRef } from "react";
import type {
  AppView,
  MediaType,
  Era,
  ShowSwipeCard,
  SwipedItem,
  SwipeDirection,
} from "../lib/showSwipe/types";
import {
  recordSwipe,
  getMediaType,
  setMediaType as saveMediaType,
  getEra,
  setEra as saveEra,
} from "../lib/showSwipe/storage";
import { fetchNextBatch } from "../lib/showSwipe/recommend";
import SwipeCard from "./show-swipe/SwipeCard";
import MediaToggle from "./show-swipe/MediaToggle";

const REFETCH_THRESHOLD = 3;

export default function ShowSwipe() {
  const [view, setView] = useState<AppView>("loading");
  const [mediaType, setMediaType] = useState<MediaType>("tv");
  const [era, setEra] = useState<Era>("recent");
  const [cards, setCards] = useState<ShowSwipeCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const fetchingRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    setMediaType(getMediaType());
    setEra(getEra());
  }, []);

  const loadCards = useCallback(
    async (mt: MediaType, e: Era) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setError(null);
      setView("loading");

      try {
        const batch = await fetchNextBatch(mt, e, new Set());
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
    loadCards(mediaType, era);
    return () => {
      aliveRef.current = false;
    };
  }, [mediaType, era, loadCards]);

  const maybeFetchMore = useCallback(
    async (currentCards: ShowSwipeCard[], mt: MediaType, e: Era) => {
      if (fetchingRef.current || currentCards.length >= REFETCH_THRESHOLD) return;
      fetchingRef.current = true;
      try {
        const existingIds = new Set(currentCards.map((c) => c.tmdbId));
        const batch = await fetchNextBatch(mt, e, existingIds);
        if (!aliveRef.current) return;
        setCards((prev) => {
          const ids = new Set(prev.map((c) => c.tmdbId));
          const fresh = batch.filter((c) => !ids.has(c.tmdbId));
          return [...prev, ...fresh];
        });
      } catch {
        // Silent fail
      } finally {
        fetchingRef.current = false;
      }
    },
    [],
  );

  const advanceCard = useCallback(
    (direction: SwipeDirection | "skip") => {
      setCards((prev) => {
        const current = prev[0];
        if (!current) return prev;

        // Only record to algo if not skipping
        if (direction !== "skip") {
          const item: SwipedItem = {
            tmdbId: current.tmdbId,
            mediaType: current.mediaType,
            title: current.title,
            genreIds: current.genreIds,
            voteAverage: current.voteAverage,
            timestamp: Date.now(),
          };
          recordSwipe(item, direction);
        }

        const remaining = prev.slice(1);

        if (remaining.length === 0) {
          setView("loading");
          fetchingRef.current = false;
          fetchNextBatch(mediaType, era, new Set())
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
          maybeFetchMore(remaining, mediaType, era);
        }

        return remaining;
      });
    },
    [mediaType, era, maybeFetchMore],
  );

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => advanceCard(direction),
    [advanceCard],
  );

  const handleSkip = useCallback(() => advanceCard("skip"), [advanceCard]);

  const handleShare = useCallback(async (card: ShowSwipeCard) => {
    const url = `https://www.youtube.com/watch?v=${card.youtubeKey}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: card.title,
          text: `Check out "${card.title}" trailer`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  }, []);

  const handleMediaToggle = useCallback(
    (mt: MediaType) => {
      setMediaType(mt);
      saveMediaType(mt);
      setCards([]);
    },
    [],
  );

  const handleEraToggle = useCallback(
    (e: Era) => {
      setEra(e);
      saveEra(e);
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
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handleSkip();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, cards.length, handleSwipe, handleSkip]);

  return (
    <div className="ss-app">
      <MediaToggle
        mediaType={mediaType}
        era={era}
        onMediaChange={handleMediaToggle}
        onEraChange={handleEraToggle}
      />

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
              onClick={() => loadCards(mediaType, era)}
            >
              Try again
            </button>
          </div>
        )}

        {view === "empty" && (
          <div className="ss-empty-state">
            <p className="ss-empty-text">
              No more trailers right now.
            </p>
            <button
              className="ss-btn ss-btn-retry"
              onClick={() => loadCards(mediaType, era)}
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
            onShare={handleShare}
            active
          />
        )}
      </div>

      {view === "swiping" && (
        <div className="ss-footer">
          <button className="ss-skip" onClick={handleSkip} aria-label="Skip this trailer">
            skip
          </button>
          <p className="ss-hint">
            swipe · arrow keys · space to skip
          </p>
        </div>
      )}

      {shared && (
        <div className="ss-toast">Link copied!</div>
      )}
    </div>
  );
}
