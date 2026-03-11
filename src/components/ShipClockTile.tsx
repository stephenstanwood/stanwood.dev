import { useState, useEffect } from "react";

interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  commitMessage?: string | null;
  error?: string;
}

interface Blurb {
  project: string | null;
  description: string;
}

/** Normalize a description to start with a past-tense verb */
function pastTense(s: string): string {
  const verbMap: [RegExp, string][] = [
    [/^add(ed|s|ing)?\s/i, "Added "],
    [/^implement(ed|s|ing)?\s/i, "Built "],
    [/^build(s|ing|t)?\s/i, "Built "],
    [/^create(d|s|ing)?\s/i, "Created "],
    [/^fix(ed|es|ing)?\s/i, "Fixed "],
    [/^update(d|s|ing)?\s/i, "Updated "],
    [/^improve(d|s|ing)?\s/i, "Improved "],
    [/^remove(d|s|ing)?\s/i, "Removed "],
    [/^refactor(ed|s|ing)?\s/i, "Refactored "],
    [/^move(d|s|ing)?\s/i, "Moved "],
    [/^rename(d|s|ing)?\s/i, "Renamed "],
    [/^replace(d|s|ing)?\s/i, "Replaced "],
    [/^swap(ped|s|ping)?\s/i, "Swapped "],
    [/^bump(ed|s|ing)?\s/i, "Bumped "],
    [/^enable(d|s|ing)?\s/i, "Enabled "],
    [/^disable(d|s|ing)?\s/i, "Disabled "],
    [/^launch(ed|es|ing)?\s/i, "Launched "],
    [/^ship(ped|s|ping)?\s/i, "Shipped "],
    [/^clean(ed|s|ing)?\s?(up)?\s/i, "Cleaned up "],
    [/^rewrite?(ten|s|ing)?\s/i, "Rewrote "],
    [/^polish(ed|es|ing)?\s/i, "Polished "],
    [/^tweak(ed|s|ing)?\s/i, "Tweaked "],
    [/^wire(d)?\s?(up)?\s/i, "Wired up "],
    [/^hook(ed)?\s?(up)?\s/i, "Hooked up "],
  ];

  for (const [pattern, replacement] of verbMap) {
    if (pattern.test(s)) return s.replace(pattern, replacement);
  }

  // If already past-tense, just capitalize
  if (/^(Added|Built|Created|Fixed|Updated|Improved|Removed|Refactored|Moved|Renamed|Replaced|Swapped|Bumped|Enabled|Disabled|Launched|Shipped|Cleaned|Rewrote|Polished|Tweaked|Wired|Hooked)\b/i.test(s)) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Fallback: prepend "Shipped"
  return "Shipped " + s.charAt(0).toLowerCase() + s.slice(1);
}

/** Parse a commit message into project name + past-tense description */
function spiffUp(msg: string): Blurb {
  let clean = msg.split("\n")[0].trim();
  // Strip conventional-commit prefixes like "feat(scope):"
  clean = clean.replace(/^(feat|fix|chore|refactor|docs|style|perf|ci|build|test)\s*(\(.+?\))?\s*:\s*/i, "");
  // Strip trailing PR refs like (#123)
  clean = clean.replace(/\s*\(#\d+\)\s*$/, "");

  // Try to split on "project: description"
  const colonIdx = clean.indexOf(":");
  if (colonIdx > 0 && colonIdx < 40) {
    const project = clean.slice(0, colonIdx).trim();
    const desc = clean.slice(colonIdx + 1).trim();
    if (desc.length > 0) {
      // Titlecase the project name
      const projectTitle = project
        .split(/[\s-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      return { project: projectTitle, description: pastTense(desc) };
    }
  }

  // No colon split — whole thing is the description
  return { project: null, description: pastTense(clean) };
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
      {blurb && (
        <div className="sct-blurb">
          {blurb.project && <span className="sct-project">{blurb.project}: </span>}
          <span className="sct-desc">{blurb.description}</span>
        </div>
      )}
    </div>
  );
}
