import launches from "../data/ai-launches.json";
import {
  type Launch,
  ORG_COLORS,
  relativeAge,
  formatLaunchDate,
  sortLaunches,
} from "../lib/aiRadar";

const sortedLaunches = sortLaunches(launches as Launch[]);

export default function AIRadarTile() {
  const latestLaunches = sortedLaunches.slice(0, 3);

  return (
    <div className="proj-tile radar-tile">
      <div className="radar-header-row">
        <div className="radar-header">
          <span className="radar-signal-dot" />
          AI RADAR
        </div>
        <span className="radar-status">
          {sortedLaunches.length} tracked
        </span>
      </div>
      <div className="radar-sub">what just shipped in AI</div>

      <div className="radar-list radar-list--visible">
        <div className="radar-entries">
          {latestLaunches.map((launch, index) => {
            const { dayNum, month } = formatLaunchDate(launch.date);
            const age = index === 0 ? relativeAge(launch.date) : null;
            return (
              <a
                key={launch.name}
                href={launch.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`radar-entry ${index === 0 ? "radar-entry--latest" : ""}`}
                style={{ borderLeftColor: ORG_COLORS[launch.org] || "#888" }}
              >
                <span className="radar-date-block">
                  <span className="radar-date-num">{dayNum}</span>
                  <span className="radar-date-month">{month}</span>
                </span>
                <span className="radar-info">
                  <span className="radar-name">
                    {launch.name}
                    {age && <span className="radar-age">{age}</span>}
                  </span>
                  <span className="radar-summary">{launch.org} — {launch.summary}</span>
                </span>
              </a>
            );
          })}
        </div>
      </div>

      <a className="radar-footer" href="/radar">
        <span className="radar-footer-text">view full radar →</span>
      </a>
    </div>
  );
}
