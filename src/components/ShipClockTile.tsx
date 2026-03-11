import { useState, useEffect } from "react";

interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  commitMessage?: string | null;
  error?: string;
}

/** Turn a git commit message into a punchy, verb-first blurb */
function spiffUp(msg: string): string {
  let clean = msg.split("\n")[0].trim();
  // Strip conventional-commit prefixes
  clean = clean.replace(/^(feat|fix|chore|refactor|docs|style|perf|ci|build|test)\s*(\(.+?\))?\s*:\s*/i, "");
  // Strip trailing metadata
  clean = clean.replace(/\s*\(#\d+\)\s*$/, "");

  // Map common commit verbs → punchier versions
  const verbMap: [RegExp, string][] = [
    [/^add(ed|s|ing)?\s/i, "Added "],
    [/^implement(ed|s|ing)?\s/i, "Built "],
    [/^create(d|s)?\s/i, "Created "],
    [/^fix(ed|es|ing)?\s/i, "Fixed "],
    [/^update(d|s)?\s/i, "Updated "],
    [/^improve(d|s)?\s/i, "Improved "],
    [/^remove(d|s)?\s/i, "Removed "],
    [/^refactor(ed|s|ing)?\s/i, "Refactored "],
    [/^move(d|s)?\s/i, "Moved "],
    [/^rename(d|s)?\s/i, "Renamed "],
    [/^replace(d|s)?\s/i, "Replaced "],
    [/^swap(ped|s)?\s/i, "Swapped "],
    [/^bump(ed|s)?\s/i, "Bumped "],
    [/^enable(d|s)?\s/i, "Enabled "],
    [/^disable(d|s)?\s/i, "Disabled "],
  ];

  for (const [pattern, replacement] of verbMap) {
    if (pattern.test(clean)) {
      clean = clean.replace(pattern, replacement);
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }

  // If no verb match, ensure it starts capitalized and starts with a verb
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);

  // If it doesn't start with a verb-like word, prepend "Shipped"
  if (!/^(Add|Built|Creat|Fix|Updat|Improv|Remov|Refactor|Ship|Launch|Enabl|Disabl|Mov|Renam|Replac|Swap|Bump)\w*/i.test(clean)) {
    clean = "Shipped " + clean.charAt(0).toLowerCase() + clean.slice(1);
  }

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

function formatElapsed(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const totalHr = Math.floor(totalMin / 60);
  const totalDays = Math.floor(totalHr / 24);

  if (totalMin < 1) return "just now";
  if (totalMin < 60) return `${totalMin}m ago`;
  if (totalHr < 24) return `${totalHr}h ${totalMin % 60}m ago`;
  if (totalDays < 7) return `${totalDays}d ${totalHr % 24}h ago`;
  return `${totalDays}d ago`;
}

export default function ShipClockTile() {
  const [data, setData] = useState<DeployData | null>(null);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    fetch("/api/ship-clock")
      .then((r) => r.json())
      .then((d: DeployData) => setData(d))
      .catch(() => null);
  }, []);

  // Tick the counter every 30s
  useEffect(() => {
    if (!data?.lastDeploy) return;
    const update = () => {
      const ms = Date.now() - new Date(data.lastDeploy!).getTime();
      setElapsed(formatElapsed(ms));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [data?.lastDeploy]);

  // Loading state
  if (!data) {
    return (
      <div className="proj-tile sct-tile">
        <div className="sct-header">
          <span className="sct-label">last update</span>
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
          <span className="sct-label">last update</span>
        </div>
        <div className="sct-blurb">couldn't reach mission control</div>
      </div>
    );
  }

  const timestamp = formatTimestamp(data.lastDeploy);
  const blurb = data.commitMessage ? spiffUp(data.commitMessage) : null;

  return (
    <div className="proj-tile sct-tile">
      <div className="sct-header">
        <span className="sct-label">last update</span>
        {elapsed && <span className="sct-elapsed">{elapsed}</span>}
      </div>
      <div className="sct-time">{timestamp}</div>
      {blurb && <div className="sct-blurb">{blurb}</div>}
    </div>
  );
}
