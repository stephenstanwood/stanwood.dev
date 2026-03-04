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
import LikedList from "./show-swipe/LikedList";

const REFETCH_THRESHOLD = 3;

type Screen = "swipe" | "liked";

export default function ShowSwipe() {
  const [screen, setScreen] = useState<Screen>("swipe");
  const [view, setView] = useState<AppView>("loading");
  const [mediaType, setMediaType] = useState<MediaType>("tv");
  const [era, setEra] = useState<Era>("recent");
  const [cards, setCards] = useState<ShowSwipeCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [flyDirection, setFlyDirection] = useState<SwipeDirection | null>(null);
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

  const doAdvance = useCallback(
    (direction: SwipeDirection | "skip") => {
      setFlyDirection(null);
      setCards((prev) => {
        const current = prev[0];
        if (!current) return prev;

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
    (direction: SwipeDirection) => doAdvance(direction),
    [doAdvance],
  );

  const handleAutoAdvance = useCallback(() => doAdvance("skip"), [doAdvance]);

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
      if (screen !== "swipe" || view !== "swiping" || cards.length === 0) return;
      if (e.key === "ArrowLeft") {
        setFlyDirection("left");
        setTimeout(() => doAdvance("left"), 350);
      }
      if (e.key === "ArrowRight") {
        setFlyDirection("right");
        setTimeout(() => doAdvance("right"), 350);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, view, cards.length, doAdvance]);

  // Liked list screen
  if (screen === "liked") {
    return (
      <div className="ss-app">
        <LikedList onBack={() => setScreen("swipe")} />
      </div>
    );
  }

  return (
    <div className="ss-app">
      <div className="ss-top-row">
        <MediaToggle
          mediaType={mediaType}
          era={era}
          onMediaChange={handleMediaToggle}
          onEraChange={handleEraToggle}
        />
        <button
          className="ss-liked-btn"
          onClick={() => setScreen("liked")}
          aria-label="View liked"
        >
          liked
        </button>
      </div>

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
            onAutoAdvance={handleAutoAdvance}
            onShare={handleShare}
            active
            parentFlyDirection={flyDirection}
          />
        )}
      </div>

      {view === "swiping" && (
        <div className="ss-footer">
          <p className="ss-hint">
            swipe or use arrow keys
          </p>
        </div>
      )}

      {shared && (
        <div className="ss-toast">Link copied!</div>
      )}
    </div>
  );
}
