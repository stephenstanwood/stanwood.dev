import launches from "../data/ai-launches.json";

interface Launch {
  name: string;
  org: string;
  date: string;
  type: string;
  summary: string;
  url: string;
}

const orgColors: Record<string, string> = {
  OpenAI: "#10a37f",
  Anthropic: "#d97706",
  Google: "#4285f4",
  Alibaba: "#ff6a00",
  Lightricks: "#a855f7",
  Apple: "#555",
  xAI: "#1d9bf0",
  NVIDIA: "#76b900",
  Inception: "#e63946",
  ByteDance: "#ff004f",
  MiniMax: "#6366f1",
};

const typeLabels: Record<string, string> = {
  model: "MODEL",
  product: "PRODUCT",
  tool: "TOOL",
  infra: "INFRA",
};

function formatDate(dateStr: string): { dayName: string; dayNum: string; month: string; year: string } {
  const d = new Date(dateStr + "T12:00:00");
  return {
    dayName: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    dayNum: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year: d.getFullYear().toString(),
  };
}

function relativeAge(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 14) return "1w ago";
  return `${Math.floor(diff / 7)}w ago`;
}

// Group launches by date
function groupByDate(items: Launch[]): { date: string; launches: Launch[] }[] {
  const groups: Record<string, Launch[]> = {};
  for (const l of items) {
    if (!groups[l.date]) groups[l.date] = [];
    groups[l.date].push(l);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([date, launches]) => ({ date, launches }));
}

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
        style={{ borderLeftColor: orgColors[latest.org] || "#888" }}
      >
        <div className="rp-lead-top">
          <span className="rp-badge">{typeLabels[latest.type] || "LAUNCH"}</span>
          <span className="rp-badge rp-badge--time">{relativeAge(latest.date)}</span>
        </div>
        <h2 className="rp-lead-name">{latest.name}</h2>
        <p className="rp-lead-summary">
          <span className="rp-org" style={{ color: orgColors[latest.org] || "#888" }}>{latest.org}</span>
          {" — "}{latest.summary}
        </p>
        <span className="rp-lead-link">read more →</span>
      </a>

      {/* Timeline */}
      <div className="rp-timeline">
        {grouped.map(({ date, launches: items }, gi) => {
          const { dayName, dayNum, month } = formatDate(date);
          const isFirst = gi === 0;
          // Skip date group if only the lead story is in it
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
                {visibleItems.map((l) => {
                  return (
                    <a
                      key={l.name}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rp-entry"
                      style={{ borderLeftColor: orgColors[l.org] || "#888" }}
                    >
                      <div className="rp-entry-header">
                        <span className="rp-entry-name">{l.name}</span>
                        <span className="rp-entry-badge">{typeLabels[l.type] || "LAUNCH"}</span>
                      </div>
                      <p className="rp-entry-summary">
                        <span className="rp-org" style={{ color: orgColors[l.org] || "#888" }}>{l.org}</span>
                        {" — "}{l.summary}
                      </p>
                    </a>
                  );
                })}
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
