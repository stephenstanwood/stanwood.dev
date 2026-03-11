import { useState, useEffect } from "react";

interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  project?: string | null;
  summary?: string | null;
  error?: string;
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

  // Tick every 30s
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

  // Loading
  if (!data) {
    return (
      <div className="proj-tile sct-tile">
        <div className="sct-inner">
          <div className="sct-header">
            <span className="sct-store">stanwood.dev</span>
          </div>
          <div className="sct-row">
            <span className="sct-row-label">loading…</span>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (data.error || !data.lastDeploy) {
    return (
      <div className="proj-tile sct-tile">
        <div className="sct-inner">
          <div className="sct-header">
            <span className="sct-store">stanwood.dev</span>
          </div>
          <div className="sct-row">
            <span className="sct-row-label">status</span>
            <span className="sct-row-value">offline</span>
          </div>
        </div>
      </div>
    );
  }

  const timestamp = formatTimestamp(data.lastDeploy);
  const deployDate = new Date(data.lastDeploy);
  const dateStr = deployDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
  const timeStr = deployDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).toLowerCase();

  return (
    <div className="proj-tile sct-tile">
      <div className="sct-inner">
        <div className="sct-header">
          <span className="sct-store">stanwood.dev</span>
          {elapsed && <span className="sct-elapsed">{elapsed}</span>}
        </div>
        <div className="sct-row">
          <span className="sct-row-label">date</span>
          <span className="sct-row-value">{dateStr}</span>
        </div>
        <div className="sct-row">
          <span className="sct-row-label">time</span>
          <span className="sct-row-value">{timeStr}</span>
        </div>
        {data.summary && (
          <>
            <hr className="sct-divider" />
            <div className="sct-blurb">
              {data.project && <span className="sct-project">{data.project}: </span>}
              <span className="sct-desc">{data.summary}</span>
            </div>
          </>
        )}
      </div>
      <div className="sct-footer">thank you for visiting</div>
    </div>
  );
}
