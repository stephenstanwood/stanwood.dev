import { useState, useEffect } from "react";
import type { StreamPhase } from "../../lib/redesignRolodex/useAnalyzeStream";

const MESSAGES: Record<string, string[]> = {
  screenshot: [
    "taking a snapshot...",
    "waiting for the page to load...",
  ],
  analyzing: [
    "reading the room...",
    "inspecting the typography...",
    "finding alternate timelines...",
    "raiding the font library...",
    "restyling reality...",
    "picking palettes from parallel universes...",
    "loading the rolodex...",
  ],
};

interface Props {
  screenshotBase64?: string;
  phase?: StreamPhase;
}

export default function LoadingSequence({ screenshotBase64, phase = "screenshot" }: Props) {
  const [idx, setIdx] = useState(0);
  const pool = phase === "screenshot" ? MESSAGES.screenshot : MESSAGES.analyzing;

  useEffect(() => {
    setIdx(0);
  }, [phase]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % pool.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [pool]);

  return (
    <div className="rr-loading">
      {screenshotBase64 && (
        <div className="rr-loading-preview">
          <img
            src={`data:image/jpeg;base64,${screenshotBase64}`}
            alt="Site preview"
            className="rr-loading-screenshot"
          />
          <div className="rr-loading-preview-overlay" />
        </div>
      )}
      <div className="rr-loading-spinner">
        <div className="rr-spinner-card rr-sc-1" />
        <div className="rr-spinner-card rr-sc-2" />
        <div className="rr-spinner-card rr-sc-3" />
      </div>
      <p className="rr-loading-text" key={`${phase}-${idx}`}>
        {pool[idx]}
      </p>
    </div>
  );
}
