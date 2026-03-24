import { useState, useCallback, useEffect } from "react";
import { pickExamples } from "../lib/redesignRolodex/examples";
import type { WeirdnessMode, AnalyzeResponse, DesignDirection } from "../lib/redesignRolodex/types";

type TileState = "idle" | "loading" | "result" | "error";

const LOADING_MESSAGES = [
  "taking a snapshot...",
  "reading the room...",
  "finding alternate timelines...",
  "restyling reality...",
  "loading the rolodex...",
];

const EXAMPLE_URLS = pickExamples(3);

export default function RedesignRolodexTile() {
  const [state, setState] = useState<TileState>("idle");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loadMsg, setLoadMsg] = useState(LOADING_MESSAGES[0]);
  const [directions, setDirections] = useState<DesignDirection[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (state !== "result" || directions.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % directions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [state, directions.length]);

  const runAnalysis = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setState("loading");
    setError("");

    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadMsg(LOADING_MESSAGES[msgIdx]);
    }, 2200);

    try {
      const res = await fetch("/api/redesign-rolodex/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim(), mode: "designer" as WeirdnessMode }),
      });
      const data = await res.json();
      clearInterval(msgInterval);

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setState("error");
        return;
      }
      const result = data as AnalyzeResponse;
      setDirections(result.directions);
      setActiveIdx(0);
      setState("result");
    } catch {
      clearInterval(msgInterval);
      setError("Network error");
      setState("error");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    runAnalysis(url);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("idle");
    setUrl("");
    setDirections([]);
    setError("");
  };

  // --- Result state ---
  if (state === "result" && directions.length > 0) {
    const direction = directions[activeIdx];
    return (
      <a href="/redesign-rolodex" className="proj-tile rrt rrt-has-result" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="rrt-result">
          <div className="rrt-result-header">
            <span className="rrt-label">REDESIGN ROLODEX</span>
            <span className="rrt-count">{directions.length} directions</span>
          </div>
          <div className="rrt-direction-name">{direction.name}</div>
          <p className="rrt-tagline">{direction.tagline}</p>
          <div className="rrt-palette-row">
            {direction.palette.map((hex, i) => (
              <span key={i} className="rrt-swatch" style={{ background: hex }} />
            ))}
          </div>
          <div className="rrt-card-dots">
            {directions.slice(0, 8).map((_, i) => (
              <span key={i} className={`rrt-dot ${i === activeIdx ? "rrt-dot-on" : ""}`} />
            ))}
          </div>
          <button className="rrt-again" onClick={handleReset}>
            try another url
          </button>
        </div>
      </a>
    );
  }

  // --- Loading state ---
  if (state === "loading") {
    return (
      <div className="proj-tile rrt rrt-loading-tile">
        <div className="rrt-loading-inner">
          <div className="rrt-spinner">
            <div className="rrt-spin-card rrt-sc-1" />
            <div className="rrt-spin-card rrt-sc-2" />
            <div className="rrt-spin-card rrt-sc-3" />
          </div>
          <span className="rrt-loading-msg">{loadMsg}</span>
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
              <div className="rrt-tile-sub">paste a URL, get alternate-universe redesigns</div>
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
        {state === "error" && (
          <div className="rrt-error">{error}</div>
        )}
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
