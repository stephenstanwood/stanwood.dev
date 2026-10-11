import launches from "../data/ai-launches.json";
import {
  type Launch,
  ORG_COLORS,
  TYPE_LABELS,
  relativeAge,
  formatLaunchDate,
  getDateRange,
  groupByDate,
  sortLaunches,
} from "../lib/aiRadar";
import { countBy } from "../lib/arrays";
import { pluralize } from "../lib/text";

const sortedLaunches = sortLaunches(launches as Launch[]);

export default function AIRadarPage() {
  const availableTypes = [...new Set(sortedLaunches.map((launch) => launch.type))].filter(
    (type) => TYPE_LABELS[type]
  );

  // CLEANUP-FLAG: the lead story assumes a nonempty feed; an empty published
  // dataset crashes prerendering. Handling it needs an explicit page fallback.
  const latest = sortedLaunches[0];
  const grouped = groupByDate(sortedLaunches);

  const typeCounts = countBy(sortedLaunches, (launch) => launch.type);

  const uniqueOrgs = new Set(sortedLaunches.map((launch) => launch.org)).size;
  const dateRange = getDateRange(sortedLaunches);

  return (
    <div className="rp-page">
      <a href="/" className="retro-back">← stanwood.dev</a>

      <header className="rp-header">
        <div className="rp-title-row">
          <h1 className="rp-title">
            <span className="rp-dot" />
            AI RADAR
          </h1>
          <span className="rp-count">{sortedLaunches.length} tracked</span>
        </div>
        <p className="rp-tagline">New tools, models, and releases. Straight to the source.</p>
        <div className="rp-stats">
          <span>{sortedLaunches.length} launches</span>
          <span className="rp-stats-sep">·</span>
          <span>{uniqueOrgs} orgs</span>
          <span className="rp-stats-sep">·</span>
          <span>{dateRange}</span>
          {availableTypes.map((type) => (
            <span key={type}>
              <span className="rp-stats-sep">·</span>
              <span style={{ color: "#555" }}>{typeCounts[type] || 0} {pluralize(typeCounts[type] || 0, TYPE_LABELS[type].toLowerCase())}</span>
            </span>
          ))}
        </div>
      </header>

      {/* Lead story */}
      <a
        href={latest.url}
        target="_blank"
        rel="noopener noreferrer"
        className="rp-lead"
        style={{ borderLeftColor: ORG_COLORS[latest.org] || "#888" }}
      >
        <div className="rp-lead-top">
          <span className="rp-badge">{TYPE_LABELS[latest.type] || "LAUNCH"}</span>
          <span className="rp-badge rp-badge--time">{relativeAge(latest.date)}</span>
        </div>
        <h2 className="rp-lead-name">{latest.name}</h2>
        <p className="rp-lead-summary">
          <span className="rp-org" style={{ color: "#38493f" }}>{latest.org}</span>
          {" — "}{latest.summary}
        </p>
        <span className="rp-lead-link">read more →</span>
      </a>

      {/* Timeline */}
      <div className="rp-timeline">
        {grouped.map(({ date, launches: items }, groupIndex) => {
          const { dayName, dayNum, month } = formatLaunchDate(date);
          const isFirst = groupIndex === 0;
          const visibleItems = isFirst ? items.slice(1) : items;
          if (visibleItems.length === 0) return null;
          return (
            <div key={date} className="rp-day">
              <div className="rp-day-marker">
                <div className="rp-day-date">
                  <span className="rp-day-num">{dayNum}</span>
                  <span className="rp-day-month">{month}</span>
                </div>
                <span className="rp-day-name">{dayName}</span>
              </div>
              <div className="rp-day-entries">
                {visibleItems.map((launch) => (
                  <a
                    key={launch.name}
                    href={launch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rp-entry"
                    style={{ borderLeftColor: ORG_COLORS[launch.org] || "#888" }}
                  >
                    <div className="rp-entry-header">
                      <span className="rp-entry-name">{launch.name}</span>
                      <span className="rp-entry-badge">{TYPE_LABELS[launch.type] || "LAUNCH"}</span>
                    </div>
                    <p className="rp-entry-summary">
                      <span className="rp-org" style={{ color: "#38493f" }}>{launch.org}</span>
                      {" — "}{launch.summary}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="rp-footer">
        <span>curated by stanwood.dev</span>
        <span>signal over noise</span>
      </footer>
    </div>
  );
}
