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
  Alibaba: "#ff6a00",
  Lightricks: "#a855f7",
  Apple: "#555",
  xAI: "#1d9bf0",
  NVIDIA: "#76b900",
  Inception: "#e63946",
  ByteDance: "#ff004f",
  MiniMax: "#6366f1",
};

function formatDate(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  return { day, date };
}

// Sort once at module load — launches is a static import, never changes.
const sorted = (launches as Launch[])
  .slice()
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function AIRadarTile() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

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
        {sorted.map((l) => {
          const { day, date } = formatDate(l.date);
          return (
            <a
              key={l.name}
              className="radar-entry"
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderLeft: `3px solid ${orgColors[l.org] || "#888"}` }}
            >
              <span className="radar-date">
                <span className="radar-day">{day}</span>
                <span className="radar-datenum">{date}</span>
              </span>
              <span className="radar-info">
                <span className="radar-name">{l.name}</span>
                <span className="radar-summary">
                  {l.org} — {l.summary}
                </span>
              </span>
            </a>
          );
        })}
      </div>

      <div className="radar-ticker" aria-hidden="true">
        <div className="radar-ticker-track">
          <span>scanning for what's new and potentially useful ✦ {sorted.length} launches tracked ✦ scanning for what's new and potentially useful ✦ {sorted.length} launches tracked ✦&nbsp;</span>
          <span>scanning for what's new and potentially useful ✦ {sorted.length} launches tracked ✦ scanning for what's new and potentially useful ✦ {sorted.length} launches tracked ✦&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
