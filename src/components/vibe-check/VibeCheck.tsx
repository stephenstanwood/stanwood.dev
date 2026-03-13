import { useState, useCallback } from "react";
import type { VibeResult } from "../../lib/vibePrompt";
import LoadingState from "./LoadingState";
import VibeScorecard from "./VibeScorecard";

type AppState = "idle" | "loading" | "result" | "error";

import { pickExamples } from "../../lib/vibeExamples";

const EXAMPLE_URLS = pickExamples(4);

export default function VibeCheck() {
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<VibeResult | null>(null);
  const [error, setError] = useState("");
  const [checkedUrl, setCheckedUrl] = useState("");

  const runVibeCheck = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setState("loading");
    setError("");
    setCheckedUrl(targetUrl.trim());

    try {
      const res = await fetch("/api/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.debug
          ? `${data.error} [${data.debug}]`
          : data.error || "Something went wrong";
        setError(msg);
        setState("error");
        return;
      }

      setResult(data);
      setState("result");
    } catch {
      setError("Network error. Check your connection and try again.");
      setState("error");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runVibeCheck(url);
  };

  const handleExample = (exampleUrl: string) => {
    setUrl(exampleUrl);
    runVibeCheck(exampleUrl);
  };

  const handleCheckAnother = () => {
    setState("idle");
    setUrl("");
    setResult(null);
    setError("");
  };

  if (state === "loading") {
    return <LoadingState />;
  }

  if (state === "result" && result) {
    return (
      <VibeScorecard
        result={result}
        url={checkedUrl}
        onCheckAnother={handleCheckAnother}
      />
    );
  }

  return (
    <div className="vc-form-container vc-fade-in">
      <h1 className="vc-title">Vibe Check</h1>
      <p className="vc-subtitle">
        paste a URL, get the vibe
      </p>

      <form onSubmit={handleSubmit} className="vc-form">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          className="vc-input"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="vc-btn-primary"
          disabled={!url.trim()}
        >
          check the vibe
        </button>
      </form>

      {error && state === "error" && (
        <div className="vc-error">
          <p>{error}</p>
          <button
            className="vc-btn-secondary"
            onClick={() => { setState("idle"); setError(""); }}
          >
            try again
          </button>
        </div>
      )}

      <div className="vc-examples">
        <span className="vc-examples-label">try:</span>
        {EXAMPLE_URLS.map((ex) => (
          <button
            key={ex}
            className="vc-example-btn"
            onClick={() => handleExample(ex)}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
