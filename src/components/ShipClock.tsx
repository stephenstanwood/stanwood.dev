import { type DeployData as DeploySummary } from "../lib/shipClockStatus";
import { timeAgo } from "../lib/time";
import { formatMonthDay, formatHourMinute } from "../lib/dateFormat";
import { pluralize } from "../lib/text";
import { useJsonOnMount } from "../hooks/useJsonOnMount";

interface HistoryEntry {
  date: string;
  message: string | null;
  sha: string | null;
  prNumber: string | null;
}

interface DeployData extends DeploySummary {
  history?: HistoryEntry[];
}

const GITHUB_REPO = "https://github.com/stephenstanwood/stanwood.dev";

export default function ShipClock() {
  const { data, failed } = useJsonOnMount<DeployData>("/api/ship-clock");

  if (!data && !failed) {
    return (
      <div className="sc-card">
        <div className="sc-number">...</div>
        <div className="sc-label">Checking the latest deploy…</div>
      </div>
    );
  }

  if (failed || !data || (data.error && data.error !== "no deploys")) {
    return (
      <div className="sc-card">
        <div className="sc-error">Couldn’t load the latest deploy.</div>
        <button className="sc-retry" type="button" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  if (data.error === "no deploys" || data.lastDeploy === null) {
    return (
      <div className="sc-card">
        <div className="sc-number">—</div>
        <div className="sc-label">No deployments yet</div>
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
  const formattedTime = formatHourMinute(deployDate);

  const days = data.daysSince!;
  const isToday = days === 0;
  const history = data.history ?? [];

  return (
    <div className="sc-wrap">
      {/* Main counter card */}
      <div className="sc-card">
        {isToday ? (
          <>
            <div className="sc-number sc-today">Shipped today</div>
            <div className="sc-label">Latest deployment</div>
          </>
        ) : (
          <>
            <div className="sc-number">{days}</div>
            <div className="sc-label">
              {pluralize(days, "day")} since last deploy
            </div>
          </>
        )}
        <div className="sc-meta">
          {formattedDate} at {formattedTime}
        </div>
      </div>

      {data.summary && <div className="sc-shipped"><div className="sc-section-label">What shipped</div><p className="sc-shipped-summary">{data.summary}</p>{data.prNumber && <a className="sc-meta-link" href={`${GITHUB_REPO}/pull/${data.prNumber}`} target="_blank" rel="noopener noreferrer">PR #{data.prNumber} ↗</a>}</div>}
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
                    {timeAgo(entry.date)} · {formatMonthDay(entry.date)}
                    {entry.sha && (
                      <a
                        className="sc-history-sha sc-meta-link"
                        href={`${GITHUB_REPO}/commit/${entry.sha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      > · {entry.sha}</a>
                    )}
                    {entry.prNumber && (
                      <a
                        className="sc-meta-link"
                        href={`${GITHUB_REPO}/pull/${entry.prNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: "6px" }}
                      >PR #{entry.prNumber}</a>
                    )}
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
