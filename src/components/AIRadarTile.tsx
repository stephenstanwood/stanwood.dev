import { useState, useEffect } from "react";
import launches from "../data/ai-launches.json";
import {
  type Launch,
  ORG_COLORS,
  TYPE_LABELS,
  relativeAge,
  formatLaunchDate,
} from "../lib/aiRadar";

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
    <div className="proj-tile radar-tile">
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
          <a
            href={latest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="radar-lead"
            style={{ borderLeftColor: ORG_COLORS[latest.org] || "#888" }}
          >
            <div className="radar-lead-meta">
              <span className="radar-type-badge">{TYPE_LABELS[latest.type] || "LAUNCH"}</span>
              <span className="radar-age">{relativeAge(latest.date)}</span>
            </div>
            <div className="radar-lead-name">{latest.name}</div>
            <div className="radar-lead-summary">
              <span className="radar-org-label" style={{ color: ORG_COLORS[latest.org] || "#888" }}>{latest.org}</span>
              {" — "}{latest.summary}
            </div>
          </a>

          {/* Secondary items */}
          <div className="radar-entries">
            {rest.map((l) => {
              const { date, month } = formatLaunchDate(l.date);
              return (
                <a
                  key={l.name}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="radar-entry"
                  style={{ borderLeftColor: ORG_COLORS[l.org] || "#888" }}
                >
                  <span className="radar-date-block">
                    <span className="radar-date-num">{date}</span>
                    <span className="radar-date-month">{month}</span>
                  </span>
                  <span className="radar-info">
                    <span className="radar-name">{l.name}</span>
                    <span className="radar-summary">{l.org} — {l.summary}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <a className="radar-footer" href="/radar">
        <span className="radar-footer-text">view full radar →</span>
      </a>
    </div>
  );
}
