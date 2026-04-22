import { useState, useEffect } from "react";
import launches from "../data/ai-launches.json";
import {
  type Launch,
  ORG_COLORS,
  TYPE_LABELS,
  relativeAge,
  formatLaunchDateFull,
  getDateRange,
  groupByDate,
  sortLaunches,
} from "../lib/aiRadar";

const sorted = sortLaunches(launches as Launch[]);

export default function AIRadarPage() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [urlRead, setUrlRead] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("type");
    const orgParam = params.get("org");
    const initialQuery = params.get("q") ?? "";
    if (typeParam && TYPE_LABELS[typeParam]) setActiveType(typeParam);
    if (orgParam) setActiveOrg(orgParam);
    if (initialQuery) setQuery(initialQuery);
    setUrlRead(true);
  }, []);

  // Sync filters to URL after initial read
  useEffect(() => {
    if (!urlRead) return;
    const params = new URLSearchParams();
    if (activeType) params.set("type", activeType);
    if (activeOrg) params.set("org", activeOrg);
    if (query.trim()) params.set("q", query.trim());
    const search = params.toString();
    history.replaceState(null, "", search ? `?${search}` : location.pathname);
  }, [activeType, activeOrg, query, urlRead]);

  const availableTypes = [...new Set(sorted.map((l) => l.type))].filter(
    (t) => TYPE_LABELS[t]
  );
  const availableOrgs = [...new Set(sorted.map((l) => l.org))];

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = sorted.filter((l) => {
    if (activeType && l.type !== activeType) return false;
    if (activeOrg && l.org !== activeOrg) return false;
    if (normalizedQuery && !`${l.name} ${l.org} ${l.summary}`.toLowerCase().includes(normalizedQuery)) return false;
    return true;
  });

  const latest = filtered[0];
  const grouped = groupByDate(filtered);

  // Count badges: type counts from full dataset; org counts filtered by active type
  const typeCountBase = sorted;
  const orgCountBase = activeType ? sorted.filter((l) => l.type === activeType) : sorted;
  const typeCounts: Record<string, number> = {};
  for (const l of typeCountBase) typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
  const orgCounts: Record<string, number> = {};
  for (const l of orgCountBase) orgCounts[l.org] = (orgCounts[l.org] || 0) + 1;

  // Stats bar
  const uniqueOrgs = new Set(sorted.map((l) => l.org)).size;
  const dateRange = getDateRange(sorted);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function toggleType(t: string) {
    setActiveOrg(null);
    setQuery("");
    setActiveType((prev) => (prev === t ? null : t));
  }

  function toggleOrg(o: string) {
    setActiveType(null);
    setQuery("");
    setActiveOrg((prev) => (prev === o ? null : o));
  }

  return (
    <div className="rp-page">
      <a href="/" className="retro-back">← stanwood.dev</a>

      <header className="rp-header">
        <div className="rp-title-row">
          <h1 className="rp-title">
            <span className="rp-dot" />
            AI RADAR
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="rp-count">
              {filtered.length < sorted.length
                ? `${filtered.length} of ${sorted.length}`
                : sorted.length}{" "}
              tracked
            </span>
            <button
              className="rp-share-btn"
              onClick={handleShare}
              title="Copy link to this view"
            >
              {copied ? "copied!" : "share →"}
            </button>
          </div>
        </div>
        <p className="rp-tagline">What just shipped in AI that's actually worth knowing about.</p>
        <div className="rp-stats">
          <span>{sorted.length} launches</span>
          <span className="rp-stats-sep">·</span>
          <span>{uniqueOrgs} orgs</span>
          <span className="rp-stats-sep">·</span>
          <span>{dateRange}</span>
          {availableTypes.map((t) => (
            <span key={t}>
              <span className="rp-stats-sep">·</span>
              <span style={{ color: "#555" }}>{typeCounts[t] || 0} {TYPE_LABELS[t].toLowerCase()}{typeCounts[t] !== 1 ? "s" : ""}</span>
            </span>
          ))}
        </div>
      </header>

      {/* Filter chips */}
      <div className="rp-filters">
        <input
          className="rp-search"
          type="search"
          placeholder="search launches..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search launches"
        />
        <div className="rp-filter-row">
          {availableTypes.map((t) => (
            <button
              key={t}
              className={`rp-chip rp-chip--type ${activeType === t ? "rp-chip--active" : ""}`}
              onClick={() => toggleType(t)}
            >
              {TYPE_LABELS[t]}
              <span className="rp-chip-count">{typeCounts[t] || 0}</span>
            </button>
          ))}
        </div>
        <div className="rp-filter-row">
          {availableOrgs.map((o) => (
            <button
              key={o}
              className={`rp-chip rp-chip--org ${activeOrg === o ? "rp-chip--active" : ""}`}
              style={activeOrg === o ? { borderColor: ORG_COLORS[o] || "#888", color: ORG_COLORS[o] || "#888" } : {}}
              onClick={() => toggleOrg(o)}
            >
              {o}
              {(orgCounts[o] || 0) > 0 && (
                <span className="rp-chip-count">{orgCounts[o]}</span>
              )}
            </button>
          ))}
        </div>
        {(activeType || activeOrg || query) && (
          <button
            className="rp-chip-clear"
            onClick={() => { setActiveType(null); setActiveOrg(null); setQuery(""); }}
          >
            clear filter ×
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rp-empty">No launches match this filter.</p>
      ) : (
        <>
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
        </>
      )}

      <footer className="rp-footer">
        <span>curated by stanwood.dev</span>
        <span>signal over noise</span>
      </footer>
    </div>
  );
}
