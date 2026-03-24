import { useState, useCallback } from "react";
import type {
  WeirdnessMode,
  MoreModifier,
  MoreResponse,
  DesignDirection,
} from "../../lib/redesignRolodex/types";
import { pickExamples } from "../../lib/redesignRolodex/examples";
import { useAnalyzeStream } from "../../lib/redesignRolodex/useAnalyzeStream";
import WeirdnessModeToggle from "./WeirdnessModeToggle";
import LoadingSequence from "./LoadingSequence";
import RolodexViewer from "./RolodexViewer";
import MoreDirectionsControls from "./MoreDirectionsControls";

const examples = pickExamples(4);

export default function RedesignRolodex() {
  const [url, setUrl] = useState("");
  const [checkedUrl, setCheckedUrl] = useState("");
  const [mode, setMode] = useState<WeirdnessMode>("designer");
  const [loadingMore, setLoadingMore] = useState(false);
  const [extraDirections, setExtraDirections] = useState<DesignDirection[]>([]);

  const stream = useAnalyzeStream();

  const allDirections = [...stream.directions, ...extraDirections];

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) return;
      setCheckedUrl(trimmed);
      setExtraDirections([]);
      stream.analyze(trimmed, mode);
    },
    [url, mode, stream.analyze],
  );

  const handleMore = useCallback(
    async (modifier: MoreModifier) => {
      if (!checkedUrl || !stream.analysis) return;
      setLoadingMore(true);

      try {
        const res = await fetch("/api/redesign-rolodex/more", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: checkedUrl,
            mode,
            modifier,
            previousNames: allDirections.map((d) => d.name),
            nextId: allDirections.length + 2,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          const result = data as MoreResponse;
          setExtraDirections((prev) => [...prev, ...result.directions]);
        }
      } catch {
        // Silently fail — user can retry
      } finally {
        setLoadingMore(false);
      }
    },
    [checkedUrl, mode, allDirections, stream.analysis],
  );

  const handleSpinAgain = useCallback(() => {
    if (!checkedUrl) return;
    setExtraDirections([]);
    stream.analyze(checkedUrl, mode);
  }, [checkedUrl, mode, stream.analyze]);

  const handleReset = useCallback(() => {
    stream.reset();
    setUrl("");
    setCheckedUrl("");
    setExtraDirections([]);
  }, [stream.reset]);

  const handleExample = useCallback((ex: string) => {
    setUrl(ex);
  }, []);

  const isIdle = stream.phase === "idle" || stream.phase === "error";
  const isLoading = stream.phase === "screenshot" || stream.phase === "analyzing";
  const hasDirections = allDirections.length > 0;

  // --- Idle / Error state ---
  if (isIdle) {
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
            placeholder="any website..."
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

        {stream.phase === "error" && stream.error && (
          <div className="rr-error">
            <p>{stream.error}</p>
            <button
              className="rr-btn-secondary"
              onClick={() => stream.reset()}
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

  // --- Loading state (before any cards arrive) ---
  if (isLoading && !hasDirections) {
    return <LoadingSequence screenshotBase64={stream.screenshotBase64} phase={stream.phase} />;
  }

  // --- Result state (directions arriving or complete) ---
  return (
    <div className="rr-result-container rr-fade-in">
      <div className="rr-result-header">
        <button className="rr-btn-reset" onClick={handleReset} type="button">
          New URL
        </button>
        <button className="rr-btn-reset" onClick={handleSpinAgain} type="button">
          Spin again
        </button>
        <span className="rr-result-url">{checkedUrl}</span>
        <span className="rr-result-count">
          {allDirections.length} direction{allDirections.length !== 1 ? "s" : ""}
          {stream.phase === "directions" && <span className="rr-streaming-dot" />}
        </span>
      </div>

      {stream.analysis && (
        <RolodexViewer
          analysis={stream.analysis}
          screenshotBase64={stream.screenshotBase64}
          directions={allDirections}
          url={checkedUrl}
          mode={mode}
        />
      )}

      <MoreDirectionsControls
        onMore={handleMore}
        loading={loadingMore}
        disabled={stream.phase === "directions"}
      />
    </div>
  );
}
