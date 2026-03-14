import { useState, useCallback } from "react";
import { vibeCheckErrorMessage, type VibeResult } from "../lib/vibePrompt";
import { pickExamples } from "../lib/vibeExamples";

type TileState = "idle" | "loading" | "result" | "error";

const LOADING_MESSAGES = [
  "reading the room...",
  "examining the energy...",
  "consulting the design spirits...",
  "checking fonts & vibes...",
  "judging gently...",
];

const EXAMPLE_URLS = pickExamples(3);

function gradeColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "#2D7A3A";
  if (letter === "B") return "#4A7A6E";
  if (letter === "C") return "#8A7A2D";
  if (letter === "D") return "#B85C2A";
  return "#C04830";
}

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  tone: "Tone",
  speed_feel: "Speed Feel",
  clarity: "Clarity",
  originality: "Originality",
  trust: "Trust",
};

export default function VibeCheckTile() {
  const [state, setState] = useState<TileState>("idle");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<VibeResult | null>(null);
  const [error, setError] = useState("");
  const [loadMsg, setLoadMsg] = useState(LOADING_MESSAGES[0]);

  const runVibeCheck = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setState("loading");
    setError("");

    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadMsg(LOADING_MESSAGES[msgIdx]);
    }, 2200);

    try {
      const res = await fetch("/api/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();
      clearInterval(msgInterval);

      if (!res.ok) {
        setError(vibeCheckErrorMessage(data));
        setState("error");
        return;
      }
      setResult(data);
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
    runVibeCheck(url);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("idle");
    setUrl("");
    setResult(null);
    setError("");
  };

  if (state === "result" && result) {
    const categories = Object.entries(result.categories) as [
      string,
      { grade: string; note: string },
    ][];
    return (
      <div className="proj-tile vct" onClick={() => window.location.href = "/vibe-check"}>
        <div className="vct-result">
          <div className="vct-result-header">
            <span className="vct-label">VIBE CHECK</span>
            <span
              className="vct-big-grade"
              style={{ color: gradeColor(result.overall_grade) }}
            >
              {result.overall_grade}
            </span>
          </div>
          <div className="vct-verdict">{result.overall_vibe}</div>
          <p className="vct-blurb">{result.main_read}</p>
          <div className="vct-grades-grid">
            {categories.map(([key, { grade }]) => (
              <span key={key} className="vct-mini-grade">
                <span className="vct-mini-label">
                  {CATEGORY_LABELS[key] || key}
                </span>
                <span style={{ color: gradeColor(grade) }}>{grade}</span>
              </span>
            ))}
          </div>
          <button
            className="vct-again"
            onClick={handleReset}
          >
            check another
          </button>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="proj-tile vct vct-loading-tile">
        <div className="vct-loading-inner">
          <div className="vct-scanner-sm">
            <div className="vct-scanner-line-sm" />
          </div>
          <span className="vct-loading-msg">{loadMsg}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="proj-tile vct">
      <div className="vct-idle">
        <div className="vct-top-row">
          <span className="vct-emoji">✨</span>
          <div className="proj-info">
            <div className="proj-name">Vibe Check</div>
            <div className="proj-tag">paste a URL, get the vibe</div>
          </div>
        </div>
        <form className="vct-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            className="vct-input"
            autoComplete="off"
            spellCheck={false}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            className="vct-go"
            disabled={!url.trim()}
            onClick={(e) => e.stopPropagation()}
          >
            check →
          </button>
        </form>
        {state === "error" && (
          <div className="vct-error">{error}</div>
        )}
        <div className="vct-examples">
          {EXAMPLE_URLS.map((ex) => (
            <button
              key={ex}
              className="vct-ex"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUrl(ex);
                runVibeCheck(ex);
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
