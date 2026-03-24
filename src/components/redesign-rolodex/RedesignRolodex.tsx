import { useState, useCallback } from "react";
import type {
  WeirdnessMode,
  SiteAnalysis,
  DesignDirection,
  MoreModifier,
  AnalyzeResponse,
  MoreResponse,
} from "../../lib/redesignRolodex/types";
import { pickExamples } from "../../lib/redesignRolodex/examples";
import WeirdnessModeToggle from "./WeirdnessModeToggle";
import LoadingSequence from "./LoadingSequence";
import RolodexViewer from "./RolodexViewer";
import MoreDirectionsControls from "./MoreDirectionsControls";

type AppState = "idle" | "loading" | "result" | "error";

const examples = pickExamples(4);

export default function RedesignRolodex() {
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [checkedUrl, setCheckedUrl] = useState("");
  const [mode, setMode] = useState<WeirdnessMode>("designer");
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [directions, setDirections] = useState<DesignDirection[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) return;

      setState("loading");
      setError("");
      setDirections([]);

      try {
        const res = await fetch("/api/redesign-rolodex/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed, mode }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong.");
          setState("error");
          return;
        }

        const result = data as AnalyzeResponse;
        setAnalysis(result.siteAnalysis);
        setScreenshotBase64(result.screenshotBase64);
        setDirections(result.directions);
        setCheckedUrl(trimmed);
        setState("result");
      } catch {
        setError("Network error. Check your connection and try again.");
        setState("error");
      }
    },
    [url, mode],
  );

  const handleMore = useCallback(
    async (modifier: MoreModifier) => {
      if (!checkedUrl || !analysis) return;
      setLoadingMore(true);

      try {
        const res = await fetch("/api/redesign-rolodex/more", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: checkedUrl,
            mode,
            modifier,
            previousNames: directions.map((d) => d.name),
            nextId: directions.length + 2,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const result = data as MoreResponse;
          setDirections((prev) => [...prev, ...result.directions]);
        }
      } catch {
        // Silently fail for more — user can retry
      } finally {
        setLoadingMore(false);
      }
    },
    [checkedUrl, mode, directions, analysis],
  );

  const handleReset = useCallback(() => {
    setState("idle");
    setUrl("");
    setCheckedUrl("");
    setAnalysis(null);
    setScreenshotBase64("");
    setDirections([]);
    setError("");
  }, []);

  const handleExample = useCallback((ex: string) => {
    setUrl(ex);
  }, []);

  // --- Idle / Input state ---
  if (state === "idle" || state === "error") {
    return (
      <div className="rr-form-container rr-fade-in">
        <h1 className="rr-title">Redesign Rolodex</h1>
        <p className="rr-subtitle">
          Paste a URL. Spin through alternate-universe redesigns.
        </p>

        <form className="rr-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="rr-input"
            placeholder="stripe.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="rr-btn-primary"
            disabled={!url.trim()}
          >
            Spin the rolodex
          </button>
        </form>

        <WeirdnessModeToggle value={mode} onChange={setMode} />

        <p className="rr-helper">
          Best for landing pages, products, portfolios, tools, and marketing
          sites.
        </p>

        {state === "error" && error && (
          <div className="rr-error">
            <p>{error}</p>
            <button
              className="rr-btn-secondary"
              onClick={() => setState("idle")}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        <div className="rr-examples">
          <span className="rr-examples-label">Try:</span>
          {examples.map((ex) => (
            <button
              key={ex}
              className="rr-example-btn"
              onClick={() => handleExample(ex)}
              type="button"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Loading state ---
  if (state === "loading") {
    return <LoadingSequence />;
  }

  // --- Result state ---
  return (
    <div className="rr-result-container rr-fade-in">
      <div className="rr-result-header">
        <button
          className="rr-btn-reset"
          onClick={handleReset}
          type="button"
        >
          New URL
        </button>
        <span className="rr-result-url">{checkedUrl}</span>
        <span className="rr-result-count">
          {directions.length} direction{directions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {analysis && (
        <RolodexViewer
          analysis={analysis}
          screenshotBase64={screenshotBase64}
          directions={directions}
          url={checkedUrl}
          mode={mode}
        />
      )}

      <MoreDirectionsControls onMore={handleMore} loading={loadingMore} />
    </div>
  );
}
