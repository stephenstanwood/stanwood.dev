import { useState, useEffect } from "react";
import launches from "../data/ai-launches.json";

interface Launch {
  name: string;
  org: string;
  date: string;
  summary: string;
  url: string;
}

const orgColors: Record<string, string> = {
  OpenAI: "#10a37f",
  Anthropic: "#d97706",
  Google: "#4285f4",
  Apple: "#555",
  Alibaba: "#ff6a00",
  Lightricks: "#a855f7",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

export default function AIRadarTile() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const sorted = (launches as Launch[])
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="proj-tile radar-tile">
      <div className="radar-header">AI RADAR</div>
      <div className="radar-sub">latest launches &amp; models</div>

      {!ready && (
        <div className="radar-anim">
          <div className="radar-dot" />
          <div className="radar-ring radar-ring-1" />
          <div className="radar-ring radar-ring-2" />
          <div className="radar-ring radar-ring-3" />
        </div>
      )}

      <div className={`radar-list ${ready ? "radar-list--visible" : ""}`}>
        {sorted.map((l) => (
          <a
            key={l.name}
            className="radar-entry"
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderLeft: `3px solid ${orgColors[l.org] || "#888"}` }}
          >
            <span className="radar-date">{formatDate(l.date)}</span>
            <span className="radar-info">
              <span className="radar-name">{l.name}</span>
              <span className="radar-summary">
                {l.org} — {l.summary}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
