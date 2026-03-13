import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
  getLiked,
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
  const [reported, setReported] = useState(false);
  const [flyDirection, setFlyDirection] = useState<SwipeDirection | null>(null);
  const [likedCount, setLikedCount] = useState(0);
  const fetchingRef = useRef(false);
  const aliveRef = useRef(true);
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMediaType(getMediaType());
    setEra(getEra());
    setLikedCount(getLiked().length);
    portalRef.current = document.getElementById("ss-liked-mount");
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
          if (direction === "right") {
            setLikedCount((c) => c + 1);
          }
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

  const sendFeedback = useCallback((context: string) => {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "show-swipe", context }),
    }).catch(() => {});
  }, []);

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

  const handleBackFromLiked = useCallback(() => {
    setLikedCount(getLiked().length);
    setScreen("swipe");
  }, []);

  const likedButton = portalRef.current
    ? createPortal(
        <button
          className="ss-liked-btn"
          onClick={() => setScreen("liked")}
          aria-label="View liked"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {likedCount > 0 && <span className="ss-liked-count">{likedCount}</span>}
        </button>,
        portalRef.current,
      )
    : null;

  // Liked list screen
  if (screen === "liked") {
    return (
      <div className="ss-app">
        {likedButton}
        <LikedList onBack={handleBackFromLiked} />
      </div>
    );
  }

  return (
    <div className="ss-app">
      {likedButton}
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
            <button
              className="ss-report-link"
              onClick={() => {
                setReported(true);
                sendFeedback(`Error: ${error} (${mediaType}/${era})`);
              }}
              disabled={reported}
            >
              {reported ? "Thanks!" : "Seeing this a lot? Let us know"}
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
            <button
              className="ss-report-link"
              onClick={() => {
                setReported(true);
                sendFeedback(`No trailers (${mediaType}/${era})`);
              }}
              disabled={reported}
            >
              {reported ? "Thanks!" : "Seeing this a lot? Let us know"}
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
