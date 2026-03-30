import { useState, useEffect } from "react";

interface HistoryEntry {
  date: string;
  message: string | null;
  sha: string | null;
  prNumber: string | null;
}

interface DeployStats {
  deploysLast30: number;
  avgDaysBetween: number | null;
  streakWeeks: number;
}

interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  project?: string | null;
  summary?: string | null;
  sha?: string | null;
  prNumber?: string | null;
  history?: HistoryEntry[];
  stats?: DeployStats;
  error?: string;
}

function getStatus(days: number): { label: string; tone: string } {
  if (days === 0) return { label: "shipped today", tone: "hot" };
  if (days === 1) return { label: "shipped yesterday", tone: "good" };
  if (days <= 3) return { label: "fresh off the line", tone: "good" };
  if (days <= 6) return { label: "clock is ticking", tone: "warn" };
  if (days <= 13) return { label: "getting rusty", tone: "warn" };
  return { label: "dust is collecting", tone: "bad" };
}

// Build a 28-cell deploy heatmap: newest right, oldest left
// each cell = one day; returns array of booleans (did a deploy happen?)
function buildActivityGrid(
  history: HistoryEntry[],
  lastDeploy: string
): boolean[] {
  const grid: boolean[] = new Array(28).fill(false);
  const now = Date.now();
  const allDates = [lastDeploy, ...history.map((h) => h.date)]
    .map((d) => new Date(d).getTime());

  for (const ts of allDates) {
    const daysAgo = Math.floor((now - ts) / 86400000);
    if (daysAgo >= 0 && daysAgo < 28) {
      grid[27 - daysAgo] = true; // newest = rightmost
    }
  }
  return grid;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ShipClock() {
  const [data, setData] = useState<DeployData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ship-clock")
      .then((r) => r.json())
      .then((d: DeployData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData({ lastDeploy: null, daysSince: null, hoursSince: null, error: "fetch failed" });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="sc-card">
        <div className="sc-number">...</div>
        <div className="sc-label">loading mission data</div>
      </div>
    );
  }

  if (!data || data.error === "api error" || data.error === "fetch failed" || data.error === "missing config") {
    return (
      <div className="sc-card">
        <div className="sc-error">couldn't reach mission control</div>
        <div className="sc-label">try again later</div>
      </div>
    );
  }

  if (data.error === "no deploys" || data.lastDeploy === null) {
    return (
      <div className="sc-card">
        <div className="sc-number">—</div>
        <div className="sc-label">no deploys yet</div>
      </div>
    );
  }

  const deployDate = new Date(data.lastDeploy);
  const formattedDate = deployDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = deployDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const days = data.daysSince!;
  const isToday = days === 0;
  const history = data.history ?? [];
  const stats = data.stats;
  const status = getStatus(days);
  const activityGrid = buildActivityGrid(history, data.lastDeploy!);

  return (
    <div className="sc-wrap">
      {/* Main counter card */}
      <div className="sc-card">
        {isToday ? (
          <>
            <div className="sc-number sc-today">shipped today 🚀</div>
            <div className="sc-label">days since last deploy</div>
          </>
        ) : (
          <>
            <div className="sc-number">{days}</div>
            <div className="sc-label">
              {days === 1 ? "day" : "days"} since last deploy
            </div>
          </>
        )}
        <div className={`sc-status sc-status--${status.tone}`}>
          {status.label}
        </div>
        <div className="sc-meta">
          {formattedDate} at {formattedTime}
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="sc-activity">
        <div className="sc-section-label">last 28 days</div>
        <div className="sc-dots">
          {activityGrid.map((active, i) => (
            <span key={i} className={`sc-dot${active ? " sc-dot--active" : ""}`} />
          ))}
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="sc-stats">
          <div className="sc-stat">
            <span className="sc-stat-num">{stats.streakWeeks}</span>
            <span className="sc-stat-label">
              {stats.streakWeeks === 1 ? "week streak" : "week streak"}
            </span>
          </div>
          <div className="sc-stat-divider" />
          <div className="sc-stat">
            <span className="sc-stat-num">{stats.deploysLast30}</span>
            <span className="sc-stat-label">deploys (30d)</span>
          </div>
          {stats.avgDaysBetween !== null && (
            <>
              <div className="sc-stat-divider" />
              <div className="sc-stat">
                <span className="sc-stat-num">{stats.avgDaysBetween}</span>
                <span className="sc-stat-label">avg days</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* What shipped */}
      {(data.summary || data.project) && (
        <div className="sc-what-shipped">
          <div className="sc-section-label">what shipped</div>
          <div className="sc-shipped-row">
            {data.project && (
              <span className="sc-project-badge">{data.project}</span>
            )}
            <span className="sc-shipped-summary">{data.summary}</span>
          </div>
          <div className="sc-shipped-meta">
            {data.sha && (
              <span className="sc-sha">{data.sha}</span>
            )}
            {data.prNumber && (
              <span className="sc-pr">PR #{data.prNumber}</span>
            )}
          </div>
        </div>
      )}

      {/* Deploy history */}
      {history.length > 0 && (
        <div className="sc-history">
          <div className="sc-section-label">recent deploys</div>
          <div className="sc-history-list">
            {history.map((entry, i) => (
              <div key={i} className="sc-history-row">
                <div className="sc-history-dot" />
                <div className="sc-history-body">
                  <span className="sc-history-msg">
                    {entry.message ?? "deploy"}
                  </span>
                  <span className="sc-history-time">
                    {timeAgo(entry.date)} · {shortDate(entry.date)}
                    {entry.sha && <span className="sc-history-sha"> · {entry.sha}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
