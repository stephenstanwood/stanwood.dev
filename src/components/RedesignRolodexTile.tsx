import { useState, useCallback, useEffect, useRef } from "react";
import { useLoadingMessages } from "../lib/redesignRolodex/useLoadingMessages";
import { pickExamples } from "../lib/redesignRolodex/examples";
import { useAnalyzeStream } from "../lib/redesignRolodex/useAnalyzeStream";
import { ghostMatch } from "../lib/redesignRolodex/topSites";
import type { WeirdnessMode } from "../lib/redesignRolodex/types";
import ErrorBoundary from "./ErrorBoundary";

export default function RedesignRolodexTile() {
  return (
    <ErrorBoundary fallback={<div className="proj-tile rrt" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#888" }}>Something went wrong.</div>}>
      <RedesignRolodexTileInner />
    </ErrorBoundary>
  );
}

function RedesignRolodexTileInner() {
  // useState initializer prevents hydration mismatch — module-scope random
  // values differ between SSR and client render
  const [EXAMPLE_URLS] = useState(() => pickExamples(3));
  const [url, setUrl] = useState("");
  const [ghost, setGhost] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const stream = useAnalyzeStream();

  // Ghost autocomplete
  useEffect(() => {
    setGhost(ghostMatch(url));
  }, [url]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && ghost) {
      e.preventDefault();
      setUrl(ghost);
      setGhost(null);
    }
  };

  // Total cards: screenshot (if available) + directions
  const hasScreenshot = !!stream.screenshotBase64;
  const totalCards = (hasScreenshot ? 1 : 0) + stream.directions.length;

  // Auto-cycle through cards
  useEffect(() => {
    if (totalCards <= 1) return;
    if (stream.phase === "idle" || stream.phase === "error") return;
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % totalCards);
    }, 3000);
    return () => clearInterval(interval);
  }, [stream.phase, totalCards]);

  const runAnalysis = useCallback(
    (targetUrl: string) => {
      if (!targetUrl.trim()) return;
      setActiveIdx(0);
      stream.analyze(targetUrl.trim(), "designer" as WeirdnessMode);
    },
    [stream.analyze],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const finalUrl = ghost && url.length >= 2 ? ghost : url;
    setUrl(finalUrl);
    runAnalysis(finalUrl);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stream.reset();
    setUrl("");
    setGhost(null);
    setActiveIdx(0);
  };

  // Is the stream doing anything? (not idle and not error)
  const isWorking = stream.phase !== "idle" && stream.phase !== "error";
  const hasContent = totalCards > 0;

  // --- Result / loading-with-content state ---
  if (isWorking && hasContent) {
    const safeIdx = activeIdx % totalCards;
    const isScreenshotCard = hasScreenshot && safeIdx === 0;
    const dirIdx = hasScreenshot ? safeIdx - 1 : safeIdx;
    const direction = !isScreenshotCard ? stream.directions[dirIdx] : null;

    const goPrev = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((i) => (i === 0 ? totalCards - 1 : i - 1));
    };
    const goNext = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((i) => (i + 1) % totalCards);
    };

    const fullPageUrl = `/redesign-rolodex?url=${encodeURIComponent(url.trim())}`;
    const stillStreaming = stream.phase === "screenshot" || stream.phase === "analyzing" || stream.phase === "directions";

    return (
      <div className="proj-tile rrt rrt-has-result">
        <div className="rrt-concept-fill">
          {isScreenshotCard ? (
            <img
              src={`data:image/jpeg;base64,${stream.screenshotBase64}`}
              alt="Current site"
              className="rrt-concept-img"
            />
          ) : direction?.conceptHtml ? (
            <iframe
              srcDoc={direction.conceptHtml}
              sandbox="allow-same-origin"
              title={direction.name}
              className="rrt-concept-iframe"
            />
          ) : null}
          <div className="rrt-concept-overlay" />
          <div className="rrt-concept-meta">
            <span className="rrt-meta-name">
              {isScreenshotCard ? "Current Site" : direction?.name ?? "..."}
            </span>
            <span className="rrt-meta-count">
              {safeIdx + 1}/{totalCards}
              {stillStreaming && <span className="rrt-streaming-dot" />}
            </span>
          </div>
          {totalCards > 1 && (
            <>
              <button className="rrt-flip rrt-flip-up" onClick={goPrev} aria-label="Previous">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button className="rrt-flip rrt-flip-down" onClick={goNext} aria-label="Next">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </>
          )}
          <div className="rrt-concept-actions">
            <a href={fullPageUrl} className="rrt-fullpage" onClick={(e) => e.stopPropagation()}>
              open &rarr;
            </a>
            <button className="rrt-again" onClick={handleReset}>new url</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading state (no content yet) ---
  if (isWorking && !hasContent) {
    return (
      <div className="proj-tile rrt rrt-loading-tile">
        <div className="rrt-loading-inner">
          <div className="rrt-spinner">
            <div className="rrt-spin-card rrt-sc-1" />
            <div className="rrt-spin-card rrt-sc-2" />
            <div className="rrt-spin-card rrt-sc-3" />
          </div>
          <TileLoadingMsg phase={stream.phase} />
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (stream.phase === "error") {
    return (
      <div className="proj-tile rrt">
        <div className="rrt-idle">
          <div className="rrt-header-block">
            <div className="rrt-title-row">
              <TileIcon />
              <div>
                <div className="rrt-tile-title">Redesign Rolodex</div>
                <div className="rrt-tile-sub">paste a URL, get alternate-universe redesigns</div>
              </div>
            </div>
          </div>
          <div className="rrt-error">{stream.error || "Something went wrong."}</div>
          <button className="rrt-again-idle" onClick={() => stream.reset()}>try again</button>
        </div>
      </div>
    );
  }

  // --- Idle state ---
  return (
    <div className="proj-tile rrt">
      <div className="rrt-idle">
        <div className="rrt-header-block">
          <div className="rrt-title-row">
            <TileIcon />
            <div>
              <div className="rrt-tile-title">Redesign Rolodex</div>
              <div className="rrt-tile-sub">paste a URL, get alternate-universe redesigns</div>
            </div>
          </div>
        </div>
        <form className="rrt-form" onSubmit={handleSubmit}>
          <div className="rrt-input-wrap">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="any website..."
              className="rrt-input"
              autoComplete="off"
              spellCheck={false}
              onClick={(e) => e.stopPropagation()}
            />
            {ghost && url.length >= 2 && (
              <span className="rrt-ghost" aria-hidden>
                <span className="rrt-ghost-typed">{url}</span>
                <span className="rrt-ghost-rest">{ghost.slice(url.length)}</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            className="rrt-go"
            disabled={!url.trim()}
            onClick={(e) => e.stopPropagation()}
          >
            spin
          </button>
        </form>
        <div className="rrt-examples">
          {EXAMPLE_URLS.map((ex) => (
            <button
              key={ex}
              className="rrt-ex"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUrl(ex);
                runAnalysis(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TileIcon() {
  return (
    <span className="rrt-icon">
      <span className="rrt-icon-card rrt-ic-1" />
      <span className="rrt-icon-card rrt-ic-2" />
      <span className="rrt-icon-card rrt-ic-3" />
    </span>
  );
}

function TileLoadingMsg({ phase }: { phase: string }) {
  const message = useLoadingMessages(phase);
  return <span className="rrt-loading-msg">{message}</span>;
}
