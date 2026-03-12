import launches from "../data/ai-launches.json";
import {
  type Launch,
  ORG_COLORS,
  TYPE_LABELS,
  relativeAge,
  formatLaunchDateFull,
  groupByDate,
} from "../lib/aiRadar";

const sorted = (launches as Launch[])
  .slice()
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const latest = sorted[0];
const grouped = groupByDate(sorted);

export default function AIRadarPage() {
  return (
    <div className="rp-page">
      <a href="/" className="retro-back">← stanwood.dev</a>

      <header className="rp-header">
        <div className="rp-title-row">
          <h1 className="rp-title">
            <span className="rp-dot" />
            AI RADAR
          </h1>
          <span className="rp-count">{sorted.length} tracked</span>
        </div>
        <p className="rp-tagline">What just shipped in AI that's actually worth knowing about.</p>
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
          <span className="rp-org" style={{ color: ORG_COLORS[latest.org] || "#888" }}>{latest.org}</span>
          {" — "}{latest.summary}
        </p>
        <span className="rp-lead-link">read more →</span>
      </a>

      {/* Timeline */}
      <div className="rp-timeline">
        {grouped.map(({ date, launches: items }, gi) => {
          const { dayName, dayNum, month } = formatLaunchDateFull(date);
          const isFirst = gi === 0;
          // Skip the date group if only the lead story falls in it
          const visibleItems = isFirst ? items.slice(1) : items;
          if (visibleItems.length === 0) return null;
          return (
            <div key={date} className={`rp-day ${isFirst ? "rp-day--latest" : ""}`}>
              <div className="rp-day-marker">
                <div className="rp-day-date">
                  <span className="rp-day-num">{dayNum}</span>
                  <span className="rp-day-month">{month}</span>
                </div>
                <span className="rp-day-name">{dayName}</span>
              </div>
              <div className="rp-day-entries">
                {visibleItems.map((l) => (
                  <a
                    key={l.name}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rp-entry"
                    style={{ borderLeftColor: ORG_COLORS[l.org] || "#888" }}
                  >
                    <div className="rp-entry-header">
                      <span className="rp-entry-name">{l.name}</span>
                      <span className="rp-entry-badge">{TYPE_LABELS[l.type] || "LAUNCH"}</span>
                    </div>
                    <p className="rp-entry-summary">
                      <span className="rp-org" style={{ color: ORG_COLORS[l.org] || "#888" }}>{l.org}</span>
                      {" — "}{l.summary}
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
