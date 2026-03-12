import { useState, useEffect } from "react";
import launches from "../data/ai-launches.json";

interface Launch {
  name: string;
  org: string;
  date: string;
  type: string;
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

const typeLabels: Record<string, string> = {
  model: "MODEL",
  product: "PRODUCT",
  tool: "TOOL",
  infra: "INFRA",
};

function formatDate(dateStr: string): { day: string; date: string; month: string } {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dateNum = d.getDate().toString();
  return { day, date: dateNum, month };
}

function relativeAge(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff}d ago`;
}

// Sort once at module load
const sorted = (launches as Launch[])
  .slice()
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function AIRadarTile() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const latest = sorted[0];
  const rest = sorted.slice(1, 9);

  return (
    <a className="proj-tile radar-tile" href="/radar">
      {/* Header */}
      <div className="radar-header-row">
        <div className="radar-header">
          <span className="radar-signal-dot" />
          AI RADAR
        </div>
        <span className="radar-status">
          {sorted.length} tracked
        </span>
      </div>
      <div className="radar-sub">what just shipped in AI</div>

      {!ready && (
        <div className="radar-anim">
          <div className="radar-dot" />
          <div className="radar-ring radar-ring-1" />
          <div className="radar-ring radar-ring-2" />
          <div className="radar-ring radar-ring-3" />
        </div>
      )}

      <div className={`radar-list ${ready ? "radar-list--visible" : ""}`}>
        {/* Two-column layout: lead left, entries right */}
        <div className="radar-body">
          {/* Lead story */}
          <div
            className="radar-lead"
            style={{ borderLeftColor: orgColors[latest.org] || "#888" }}
          >
            <div className="radar-lead-meta">
              <span className="radar-type-badge">{typeLabels[latest.type] || "LAUNCH"}</span>
              <span className="radar-age">{relativeAge(latest.date)}</span>
            </div>
            <div className="radar-lead-name">{latest.name}</div>
            <div className="radar-lead-summary">
              <span className="radar-org-label" style={{ color: orgColors[latest.org] || "#888" }}>{latest.org}</span>
              {" — "}{latest.summary}
            </div>
          </div>

          {/* Secondary items */}
          <div className="radar-entries">
            {rest.map((l) => {
              const { date, month } = formatDate(l.date);
              return (
                <div
                  key={l.name}
                  className="radar-entry"
                  style={{ borderLeftColor: orgColors[l.org] || "#888" }}
                >
                  <span className="radar-date-block">
                    <span className="radar-date-num">{date}</span>
                    <span className="radar-date-month">{month}</span>
                  </span>
                  <span className="radar-info">
                    <span className="radar-name">{l.name}</span>
                    <span className="radar-summary">{l.org} — {l.summary}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="radar-footer">
        <span className="radar-footer-text">view full radar →</span>
      </div>
    </a>
  );
}
