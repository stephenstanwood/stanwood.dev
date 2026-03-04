import { useRef, useCallback, useState, useEffect } from "react";
import type { ShowSwipeCard, SwipeDirection } from "../../lib/showSwipe/types";
import TrailerPlayer from "./TrailerPlayer";

interface Props {
  card: ShowSwipeCard;
  onSwipe: (direction: SwipeDirection) => void;
  onShare: (card: ShowSwipeCard) => void;
  active: boolean;
}

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.5;

export default function SwipeCard({ card, onSwipe, onShare, active }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startTime = useRef(0);
  const [deltaX, setDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [flyOff, setFlyOff] = useState<SwipeDirection | null>(null);
  const dragging = useRef(false);

  const startDrag = useCallback(
    (clientX: number) => {
      if (!active) return;
      startX.current = clientX;
      startTime.current = Date.now();
      setSwiping(true);
    },
    [active],
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
      setFlyOff(direction);
      setTimeout(() => onSwipe(direction), 350);
    } else {
      setDeltaX(0);
    }
  }, [swiping, deltaX, onSwipe]);

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
      setFlyOff(direction);
      setTimeout(() => onSwipe(direction), 350);
    },
    [onSwipe],
  );

  const rotation = deltaX * 0.06;
  const overlayOpacity = Math.min(Math.abs(deltaX) / 120, 0.8);

  const style: React.CSSProperties = flyOff
    ? {
        transform: `translateX(${flyOff === "right" ? 120 : -120}vw) rotate(${flyOff === "right" ? 20 : -20}deg)`,
        transition: "transform 0.35s cubic-bezier(.2,1,.3,1)",
      }
    : {
        transform: `translateX(${deltaX}px) rotate(${rotation}deg)`,
        transition: swiping ? "none" : "transform 0.3s ease",
      };

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
          <span className="ss-overlay-label ss-label-nope">NEXT</span>
        </div>
      )}

      <div className="ss-card-trailer">
        <TrailerPlayer youtubeKey={card.youtubeKey} title={card.title} />
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
          NEXT
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
