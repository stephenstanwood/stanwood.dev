import { useState, useEffect } from "react";

interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  commitMessage?: string | null;
  error?: string;
}

/** Condense a git commit message into a short, punchy blurb */
function spiffUp(msg: string): string {
  // Strip "Co-Authored-By" lines and clean up
  let clean = msg.split("\n")[0].trim();
  // Remove conventional-commit prefixes like "feat:" or "fix:"
  clean = clean.replace(/^(feat|fix|chore|refactor|docs|style|perf|ci|build|test)\s*(\(.+?\))?\s*:\s*/i, "");
  // Capitalize first letter
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  // Truncate if too long
  if (clean.length > 60) clean = clean.slice(0, 57) + "…";
  return clean;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).toLowerCase();

  if (diffDays === 0) return `today at ${time}`;
  if (diffDays === 1) return `yesterday at ${time}`;
  if (diffDays < 7) {
    const day = d.toLocaleDateString("en-US", { weekday: "long" });
    return `${day} at ${time}`;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + ` at ${time}`;
}

export default function ShipClockTile() {
  const [data, setData] = useState<DeployData | null>(null);

  useEffect(() => {
    fetch("/api/ship-clock")
      .then((r) => r.json())
      .then((d: DeployData) => setData(d))
      .catch(() => null);
  }, []);

  // Loading state — minimal skeleton
  if (!data) {
    return (
      <div className="proj-tile sct-tile">
        <div className="sct-header">
          <span className="sct-label">last deploy</span>
        </div>
        <div className="sct-blurb">loading…</div>
      </div>
    );
  }

  // Error / no data
  if (data.error || !data.lastDeploy) {
    return (
      <div className="proj-tile sct-tile">
        <div className="sct-header">
          <span className="sct-label">last deploy</span>
        </div>
        <div className="sct-blurb">couldn't reach mission control</div>
      </div>
    );
  }

  const days = data.daysSince ?? 0;
  const timestamp = formatTimestamp(data.lastDeploy);
  const blurb = data.commitMessage ? spiffUp(data.commitMessage) : null;

  return (
    <div className="proj-tile sct-tile">
      <div className="sct-header">
        <span className="sct-label">last deploy</span>
        {days === 0 && <span className="sct-badge">today</span>}
      </div>
      <div className="sct-time">{timestamp}</div>
      {blurb && <div className="sct-blurb">{blurb}</div>}
    </div>
  );
}
