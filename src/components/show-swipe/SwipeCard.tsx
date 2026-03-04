import { useRef, useCallback, useState, useEffect } from "react";
import type { ShowSwipeCard, SwipeDirection } from "../../lib/showSwipe/types";
import TrailerPlayer from "./TrailerPlayer";

interface Props {
  card: ShowSwipeCard;
  onSwipe: (direction: SwipeDirection) => void;
  onAutoAdvance: () => void;
  onShare: (card: ShowSwipeCard) => void;
  active: boolean;
  parentFlyDirection?: SwipeDirection | null;
}

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.5;
const COUNTDOWN_SECONDS = 5;

export default function SwipeCard({ card, onSwipe, onAutoAdvance, onShare, active, parentFlyDirection }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startTime = useRef(0);
  const [deltaX, setDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [flyOff, setFlyOff] = useState<SwipeDirection | null>(null);
  const dragging = useRef(false);

  // Countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCountdown = useCallback(() => {
    setCountdown(null);
    if (countdownTimer.current) {
      clearTimeout(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  // When trailer ends, start countdown
  const handleTrailerEnded = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  // When trailer can't be embedded, skip immediately
  const handleTrailerError = useCallback(() => {
    setFlyOff("left");
    setTimeout(() => onAutoAdvance(), 350);
  }, [onAutoAdvance]);

  // Tick the countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      // Auto-advance with fly-off
      setFlyOff("left");
      setTimeout(() => onAutoAdvance(), 350);
      return;
    }
    countdownTimer.current = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
    };
  }, [countdown, onAutoAdvance]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearCountdown();
  }, [clearCountdown]);

  const startDrag = useCallback(
    (clientX: number) => {
      if (!active) return;
      clearCountdown();
      startX.current = clientX;
      startTime.current = Date.now();
      setSwiping(true);
    },
    [active, clearCountdown],
  );

  const moveDrag = useCallback(
    (clientX: number) => {
      if (!swiping) return;
      setDeltaX(clientX - startX.current);
    },
    [swiping],
  );

  const endDrag = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);
    dragging.current = false;

    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(deltaX) / elapsed;
    const absDelta = Math.abs(deltaX);

    if (absDelta > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      const direction: SwipeDirection = deltaX > 0 ? "right" : "left";
      clearCountdown();
      setFlyOff(direction);
      setTimeout(() => onSwipe(direction), 350);
    } else {
      setDeltaX(0);
    }
  }, [swiping, deltaX, onSwipe, clearCountdown]);

  // Touch
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => startDrag(e.touches[0].clientX),
    [startDrag],
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => moveDrag(e.touches[0].clientX),
    [moveDrag],
  );
  const handleTouchEnd = useCallback(() => endDrag(), [endDrag]);

  // Mouse
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, iframe, a, .ss-play-btn")) return;
      e.preventDefault();
      dragging.current = true;
      startDrag(e.clientX);
    },
    [startDrag],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      moveDrag(e.clientX);
    }
    function onMouseUp() {
      if (!dragging.current) return;
      endDrag();
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [moveDrag, endDrag]);

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      clearCountdown();
      setFlyOff(direction);
      setTimeout(() => onSwipe(direction), 350);
    },
    [onSwipe, clearCountdown],
  );

  const rotation = deltaX * 0.06;
  const overlayOpacity = Math.min(Math.abs(deltaX) / 120, 0.8);

  const effectiveFlyOff = flyOff ?? parentFlyDirection ?? null;

  const style: React.CSSProperties = effectiveFlyOff
    ? {
        transform: `translateX(${effectiveFlyOff === "right" ? 120 : -120}vw) rotate(${effectiveFlyOff === "right" ? 20 : -20}deg)`,
        transition: "transform 0.35s cubic-bezier(.2,1,.3,1)",
      }
    : {
        transform: `translateX(${deltaX}px) rotate(${rotation}deg)`,
        transition: swiping ? "none" : "transform 0.3s ease",
      };

  // Countdown arc: SVG circle dash for film-leader style
  const arcRadius = 38;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcProgress = countdown !== null ? (countdown / COUNTDOWN_SECONDS) : 1;

  return (
    <div
      ref={cardRef}
      className="ss-card"
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Swipe overlays */}
      {deltaX > 10 && !flyOff && (
        <div
          className="ss-swipe-overlay ss-overlay-yes"
          style={{ opacity: overlayOpacity }}
        >
          <span className="ss-overlay-label ss-label-yes">INTO IT</span>
        </div>
      )}
      {deltaX < -10 && !flyOff && (
        <div
          className="ss-swipe-overlay ss-overlay-nope"
          style={{ opacity: overlayOpacity }}
        >
          <span className="ss-overlay-label ss-label-nope">PASS</span>
        </div>
      )}

      {/* Film-leader countdown overlay */}
      {countdown !== null && !flyOff && (
        <div className="ss-countdown-overlay">
          <div className="ss-countdown-leader">
            <svg viewBox="0 0 100 100" className="ss-countdown-svg">
              {/* Film-leader crosshairs */}
              <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              {/* Outer ring */}
              <circle cx="50" cy="50" r={arcRadius} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
              {/* Progress arc */}
              <circle
                cx="50"
                cy="50"
                r={arcRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={arcCircumference}
                strokeDashoffset={arcCircumference * (1 - arcProgress)}
                className="ss-countdown-arc"
              />
              {/* Corner marks (film-leader style) */}
              <rect x="10" y="10" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <rect x="84" y="10" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <rect x="10" y="84" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <rect x="84" y="84" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            </svg>
            <span className="ss-countdown-number">{countdown}</span>
          </div>
          <p className="ss-countdown-label">next trailer</p>
        </div>
      )}

      <div className="ss-card-trailer">
        <TrailerPlayer
          youtubeKey={card.youtubeKey}
          title={card.title}
          originalLanguage={card.originalLanguage}
          onEnded={handleTrailerEnded}
          onError={handleTrailerError}
        />
      </div>

      <div className="ss-card-info">
        <div className="ss-card-title-row">
          <h2 className="ss-card-title">{card.title}</h2>
          <button
            className="ss-share-link"
            onClick={(e) => {
              e.stopPropagation();
              onShare(card);
            }}
            aria-label="Share trailer"
          >
            send to a friend
          </button>
        </div>

        <div className="ss-card-meta">
          <span className="ss-card-year">{card.year}</span>
          <span className="ss-card-dot">·</span>
          <span className="ss-card-rating">
            {"★"} {card.voteAverage.toFixed(1)}
          </span>
          {card.genreNames.length > 0 && (
            <>
              <span className="ss-card-dot">·</span>
              <span className="ss-card-genres">
                {card.genreNames.slice(0, 2).join(", ")}
              </span>
            </>
          )}
        </div>

        {card.overview && (
          <p className="ss-card-overview">{card.overview}</p>
        )}
      </div>

      <div className="ss-card-actions">
        <button
          className="ss-btn ss-btn-nope"
          onClick={(e) => {
            e.stopPropagation();
            triggerSwipe("left");
          }}
          aria-label="Pass"
        >
          PASS
        </button>
        <button
          className="ss-btn ss-btn-yes"
          onClick={(e) => {
            e.stopPropagation();
            triggerSwipe("right");
          }}
          aria-label="Interested"
        >
          INTO IT
        </button>
      </div>
    </div>
  );
}
