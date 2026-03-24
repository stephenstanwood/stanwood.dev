import { useState, useCallback, useEffect, useRef } from "react";
import type {
  DesignDirection,
  SiteAnalysis,
  WeirdnessMode,
} from "../../lib/redesignRolodex/types";
import CurrentSiteCard from "./CurrentSiteCard";
import DesignDirectionCard from "./DesignDirectionCard";

interface Props {
  analysis: SiteAnalysis;
  screenshotBase64: string;
  directions: DesignDirection[];
  url: string;
  mode: WeirdnessMode;
}

export default function RolodexViewer({
  analysis,
  screenshotBase64,
  directions,
  url,
  mode,
}: Props) {
  const totalCards = 1 + directions.length;
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(
    () => setActiveIdx((i) => Math.max(0, i - 1)),
    [],
  );
  const next = useCallback(
    () => setActiveIdx((i) => Math.min(totalCards - 1, i + 1)),
    [totalCards],
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  // Touch/swipe
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (touchStartX.current === null) return;
      const dx = e.clientX - touchStartX.current;
      if (Math.abs(dx) > 40) {
        if (dx < 0) next();
        else prev();
      }
      touchStartX.current = null;
    },
    [prev, next],
  );

  // Clamp if directions grow
  useEffect(() => {
    if (activeIdx >= totalCards) setActiveIdx(totalCards - 1);
  }, [totalCards, activeIdx]);

  return (
    <div className="rr-rolodex-container">
      <div className="rr-rolodex-counter">
        {activeIdx + 1} / {totalCards}
      </div>

      <div className="rr-rolodex-stage">
        <button
          className="rr-nav-btn rr-nav-prev"
          onClick={prev}
          disabled={activeIdx === 0}
          aria-label="Previous card"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <div
          className="rr-rolodex-track"
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {/* Current site card */}
          <div
            className={`rr-rolodex-slot ${getSlotClass(0, activeIdx)}`}
            style={getSlotStyle(0, activeIdx)}
          >
            <CurrentSiteCard
              analysis={analysis}
              screenshotBase64={screenshotBase64}
            />
          </div>

          {/* Direction cards */}
          {directions.map((d, i) => (
            <div
              key={d.id}
              className={`rr-rolodex-slot ${getSlotClass(i + 1, activeIdx)}`}
              style={getSlotStyle(i + 1, activeIdx)}
            >
              <DesignDirectionCard
                direction={d}
                url={url}
                analysis={analysis}
                mode={mode}
              />
            </div>
          ))}
        </div>

        <button
          className="rr-nav-btn rr-nav-next"
          onClick={next}
          disabled={activeIdx === totalCards - 1}
          aria-label="Next card"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <div className="rr-rolodex-dots">
        {Array.from({ length: totalCards }, (_, i) => (
          <button
            key={i}
            className={`rr-dot ${i === activeIdx ? "rr-dot-active" : ""}`}
            onClick={() => setActiveIdx(i)}
            aria-label={`Go to card ${i + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

function getSlotClass(idx: number, activeIdx: number): string {
  const diff = idx - activeIdx;
  if (diff === 0) return "rr-slot-active";
  if (diff === -1) return "rr-slot-prev";
  if (diff === 1) return "rr-slot-next";
  if (diff < -1) return "rr-slot-far-prev";
  return "rr-slot-far-next";
}

function getSlotStyle(
  idx: number,
  activeIdx: number,
): React.CSSProperties {
  const diff = idx - activeIdx;
  if (diff === 0) {
    return {
      transform: "translateX(0) scale(1) rotateY(0deg)",
      opacity: 1,
      zIndex: 10,
      pointerEvents: "auto",
    };
  }
  if (diff === -1) {
    return {
      transform: "translateX(-65%) scale(0.85) rotateY(8deg)",
      opacity: 0.6,
      zIndex: 5,
      pointerEvents: "none",
    };
  }
  if (diff === 1) {
    return {
      transform: "translateX(65%) scale(0.85) rotateY(-8deg)",
      opacity: 0.6,
      zIndex: 5,
      pointerEvents: "none",
    };
  }
  // Far away
  const sign = diff < 0 ? -1 : 1;
  return {
    transform: `translateX(${sign * 120}%) scale(0.7) rotateY(${sign * -12}deg)`,
    opacity: 0,
    zIndex: 0,
    pointerEvents: "none",
  };
}
