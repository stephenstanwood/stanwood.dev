import { useState, useEffect } from "react";
import launches from "../data/ai-launches.json";

interface Launch {
  name: string;
  org: string;
  date: string;
  summary: string;
  url: string;
}

function daysAgo(dateStr: string): string {
  const d = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000
  );
  if (d === 0) return "today";
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

export default function AIRadarTile() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const sorted = (launches as Launch[])
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="proj-tile radar-tile">
      <div className="radar-header">AI RADAR</div>

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
          >
            <span className="radar-org">{l.org}</span>
            <span className="radar-name">{l.name}</span>
            <span className="radar-summary">{l.summary}</span>
            <span className="radar-date">{daysAgo(l.date)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
