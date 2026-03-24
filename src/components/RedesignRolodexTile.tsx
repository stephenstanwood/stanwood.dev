import { useState, useCallback, useEffect } from "react";
import { pickExamples } from "../lib/redesignRolodex/examples";
import { useAnalyzeStream } from "../lib/redesignRolodex/useAnalyzeStream";
import type { WeirdnessMode } from "../lib/redesignRolodex/types";

const EXAMPLE_URLS = pickExamples(3);

export default function RedesignRolodexTile() {
  const [url, setUrl] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const stream = useAnalyzeStream();

  // Auto-cycle through directions in result state
  useEffect(() => {
    if (stream.phase !== "done" && stream.phase !== "directions") return;
    if (stream.directions.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % stream.directions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [stream.phase, stream.directions.length]);

  const runAnalysis = useCallback(
    (targetUrl: string) => {
      if (!targetUrl.trim()) return;
      setActiveIdx(0);
      stream.analyze(targetUrl.trim(), "designer" as WeirdnessMode);
    },
    [stream.analyze],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    runAnalysis(url);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stream.reset();
    setUrl("");
  };

  const hasResults =
    (stream.phase === "done" || stream.phase === "directions") &&
    stream.directions.length > 0;

  // --- Result state ---
  if (hasResults) {
    const d = stream.directions[activeIdx % stream.directions.length];
    return (
      <div className="proj-tile rrt rrt-has-result">
        <div className="rrt-result">
          <div className="rrt-result-header">
            <span className="rrt-label">REDESIGN ROLODEX</span>
            <span className="rrt-count">
              {stream.directions.length} directions
              {stream.phase === "directions" && <span className="rrt-streaming-dot" />}
            </span>
          </div>
          <div className="rrt-direction-name">{d?.name}</div>
          <p className="rrt-tagline">{d?.tagline}</p>
          <div className="rrt-palette-row">
            {d?.palette.map((hex, i) => (
              <span key={i} className="rrt-swatch" style={{ background: hex }} />
            ))}
          </div>
          <div className="rrt-card-dots">
            {stream.directions.slice(0, 8).map((_, i) => (
              <span
                key={i}
                className={`rrt-dot ${i === activeIdx % stream.directions.length ? "rrt-dot-on" : ""}`}
              />
            ))}
          </div>
          <div className="rrt-result-actions">
            <a
              href="/redesign-rolodex"
              className="rrt-fullpage"
              onClick={(e) => e.stopPropagation()}
            >
              Open full page &rarr;
            </a>
            <button className="rrt-again" onClick={handleReset}>
              try another url
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading state ---
  if (
    stream.phase === "screenshot" ||
    stream.phase === "analyzing"
  ) {
    return (
      <div className="proj-tile rrt rrt-loading-tile">
        <div className="rrt-loading-inner">
          {stream.screenshotBase64 && (
            <img
              src={`data:image/png;base64,${stream.screenshotBase64}`}
              alt=""
              className="rrt-loading-thumb"
            />
          )}
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
              <span className="rrt-icon">
                <span className="rrt-icon-card rrt-ic-1" />
                <span className="rrt-icon-card rrt-ic-2" />
                <span className="rrt-icon-card rrt-ic-3" />
              </span>
              <div>
                <div className="rrt-tile-title">Redesign Rolodex</div>
                <div className="rrt-tile-sub">paste a URL, get alternate-universe redesigns</div>
              </div>
            </div>
          </div>
          <div className="rrt-error">{stream.error || "Something went wrong."}</div>
          <button className="rrt-again" onClick={() => stream.reset()}>
            try again
          </button>
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
            <span className="rrt-icon">
              <span className="rrt-icon-card rrt-ic-1" />
              <span className="rrt-icon-card rrt-ic-2" />
              <span className="rrt-icon-card rrt-ic-3" />
            </span>
            <div>
              <div className="rrt-tile-title">Redesign Rolodex</div>
              <div className="rrt-tile-sub">
                paste a URL, get alternate-universe redesigns
              </div>
            </div>
          </div>
        </div>
        <form className="rrt-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="any website..."
            className="rrt-input"
            autoComplete="off"
            spellCheck={false}
            onClick={(e) => e.stopPropagation()}
          />
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

function TileLoadingMsg({ phase }: { phase: string }) {
  const [idx, setIdx] = useState(0);
  const msgs =
    phase === "screenshot"
      ? ["taking a snapshot...", "waiting for the page..."]
      : ["reading the room...", "finding alternate timelines...", "restyling reality...", "loading the rolodex..."];

  useEffect(() => {
    setIdx(0);
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % msgs.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [phase]);

  return <span className="rrt-loading-msg">{msgs[idx]}</span>;
}
