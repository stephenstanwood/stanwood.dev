import { useState, useEffect } from "react";
import launches from "../data/ai-launches.json";
import {
  type Launch,
  LAB_PROFILES,
  ORG_COLORS,
  TYPE_LABELS,
  relativeAge,
  formatLaunchDateFull,
  getDateRange,
  groupByDate,
  sortLaunches,
  computePulse,
} from "../lib/aiRadar";

const STANCE_LABELS: Record<string, string> = {
  closed: "closed weights",
  open: "open weights",
  mixed: "mixed",
  infra: "infrastructure",
};

const sorted = sortLaunches(launches as Launch[]);
const pulse = computePulse(sorted);

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

  // Latest example per type — sorted is already newest-first
  const latestByType: Record<string, Launch | undefined> = {
    model: sorted.find((l) => l.type === "model"),
    product: sorted.find((l) => l.type === "product"),
    tool: sorted.find((l) => l.type === "tool"),
    infra: sorted.find((l) => l.type === "infra"),
  };

  const fieldMapTypes: { type: string; emoji: string; whatItIs: string; whyMatters: string }[] = [
    { type: "model", emoji: "🧠", whatItIs: "A new foundation model — the brain.", whyMatters: "Shifts what's possible. New ceiling on reasoning, coding, context." },
    { type: "product", emoji: "📱", whatItIs: "A consumer app or feature.", whyMatters: "How non-builders actually feel AI in their day." },
    { type: "tool", emoji: "🔧", whatItIs: "A developer API, SDK, or capability.", whyMatters: "What you can build with this week — the new primitives." },
    { type: "infra", emoji: "⚙️", whatItIs: "Hardware, platforms, the backbone.", whyMatters: "Who runs what at what price — the rails everyone shares." },
  ];

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

      {/* Pulse — at-a-glance read of the last 7 / 30 days */}
      {pulse.totalLast30 > 0 && (
        <section className="rp-pulse" aria-labelledby="rp-pulse-title">
          <div className="rp-pulse-head">
            <h2 id="rp-pulse-title" className="rp-pulse-title">The Pulse</h2>
            <span className="rp-pulse-sub">last 7 days · last 30 days</span>
          </div>
          <div className="rp-pulse-grid">
            <div className="rp-pulse-stat">
              <div className="rp-pulse-num">
                {pulse.thisWeek}
                {pulse.weekDelta !== 0 && (
                  <span
                    className={`rp-pulse-delta rp-pulse-delta--${pulse.weekDelta > 0 ? "up" : "down"}`}
                    aria-label={`${pulse.weekDelta > 0 ? "up" : "down"} ${Math.abs(pulse.weekDelta)} from prior week`}
                  >
                    {pulse.weekDelta > 0 ? "▲" : "▼"}
                    {Math.abs(pulse.weekDelta)}
                  </span>
                )}
              </div>
              <div className="rp-pulse-label">this week</div>
              <div className="rp-pulse-foot">vs {pulse.priorWeek} prior</div>
            </div>
            <div className="rp-pulse-stat">
              <div className="rp-pulse-num">
                {pulse.daysSinceLast === null ? "—" : `${pulse.daysSinceLast}d`}
              </div>
              <div className="rp-pulse-label">since last drop</div>
              <div className="rp-pulse-foot">
                {pulse.daysSinceLast === null
                  ? "no recent launches"
                  : pulse.daysSinceLast === 0
                  ? "shipped today"
                  : pulse.daysSinceLast === 1
                  ? "yesterday"
                  : "freshness signal"}
              </div>
            </div>
            {pulse.topOrg && (
              <button
                className={`rp-pulse-stat rp-pulse-stat--clickable ${activeOrg === pulse.topOrg.name ? "rp-pulse-stat--active" : ""}`}
                onClick={() => toggleOrg(pulse.topOrg!.name)}
                style={{
                  borderColor:
                    activeOrg === pulse.topOrg.name
                      ? ORG_COLORS[pulse.topOrg.name] || "#888"
                      : undefined,
                }}
                title={`Filter to ${pulse.topOrg.name}`}
              >
                <div
                  className="rp-pulse-num rp-pulse-num--text"
                  style={{ color: ORG_COLORS[pulse.topOrg.name] || "var(--rp-ink)" }}
                >
                  {pulse.topOrg.name}
                </div>
                <div className="rp-pulse-label">on a tear</div>
                <div className="rp-pulse-foot">
                  {pulse.topOrg.count} in 30d · tap to filter
                </div>
              </button>
            )}
            {pulse.topType && (
              <button
                className={`rp-pulse-stat rp-pulse-stat--clickable ${activeType === pulse.topType.type ? "rp-pulse-stat--active" : ""}`}
                onClick={() => toggleType(pulse.topType!.type)}
                title={`Filter to ${TYPE_LABELS[pulse.topType.type] || "LAUNCH"}`}
              >
                <div className="rp-pulse-num rp-pulse-num--text">
                  {TYPE_LABELS[pulse.topType.type] || "LAUNCH"}
                </div>
                <div className="rp-pulse-label">most this month</div>
                <div className="rp-pulse-foot">
                  {pulse.topType.count} of {pulse.totalLast30} · tap to filter
                </div>
              </button>
            )}
          </div>
          {pulse.typeBreakdown.length > 1 && (
            <div className="rp-pulse-bar-wrap" aria-label="Launch type breakdown for the last 30 days">
              <div className="rp-pulse-bar">
                {pulse.typeBreakdown.map(({ type, pct }) => (
                  <span
                    key={type}
                    className={`rp-pulse-bar-seg rp-pulse-bar-seg--${type}`}
                    style={{ width: `${pct}%` }}
                    title={`${TYPE_LABELS[type] || type}: ${pct}%`}
                  />
                ))}
              </div>
              <div className="rp-pulse-legend">
                {pulse.typeBreakdown.map(({ type, count }) => (
                  <span key={type} className="rp-pulse-legend-item">
                    <span className={`rp-pulse-legend-dot rp-pulse-bar-seg--${type}`} />
                    {TYPE_LABELS[type] || type} <span className="rp-pulse-legend-count">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Field map — explains the launch types with a real recent example */}
      <section className="rp-fieldmap" aria-labelledby="rp-fieldmap-title">
        <div className="rp-fieldmap-head">
          <h2 id="rp-fieldmap-title" className="rp-fieldmap-title">The Field</h2>
          <span className="rp-fieldmap-sub">what we track · tap to filter</span>
        </div>
        <div className="rp-fieldmap-grid">
          {fieldMapTypes.map(({ type, emoji, whatItIs, whyMatters }) => {
            const example = latestByType[type];
            const count = typeCounts[type] || 0;
            const hasExample = !!example;
            const isActive = activeType === type;
            return (
              <button
                key={type}
                className={`rp-fieldmap-card rp-fieldmap-card--${type} ${isActive ? "rp-fieldmap-card--active" : ""} ${!hasExample ? "rp-fieldmap-card--empty" : ""}`}
                onClick={() => hasExample && toggleType(type)}
                disabled={!hasExample}
                aria-pressed={isActive}
                title={hasExample ? `Filter to ${TYPE_LABELS[type]}` : `No ${TYPE_LABELS[type].toLowerCase()} launches tracked yet`}
              >
                <div className="rp-fieldmap-card-head">
                  <span className="rp-fieldmap-emoji" aria-hidden="true">{emoji}</span>
                  <span className={`rp-fieldmap-label rp-fieldmap-label--${type}`}>{TYPE_LABELS[type]}</span>
                  <span className="rp-fieldmap-count">{count}</span>
                </div>
                <p className="rp-fieldmap-what">{whatItIs}</p>
                <p className="rp-fieldmap-why">{whyMatters}</p>
                {hasExample ? (
                  <p className="rp-fieldmap-eg">
                    <span className="rp-fieldmap-eg-label">latest</span>
                    <span className="rp-fieldmap-eg-name">{example!.name}</span>
                    <span className="rp-fieldmap-eg-org" style={{ color: ORG_COLORS[example!.org] || "#888" }}>{example!.org}</span>
                  </p>
                ) : (
                  <p className="rp-fieldmap-eg rp-fieldmap-eg--empty">
                    <span className="rp-fieldmap-eg-label">watching</span>
                    <span className="rp-fieldmap-eg-empty">none in feed yet — when one ships, it lands here</span>
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* The Labs — who actually ships in this space */}
      <section className="rp-labs" aria-labelledby="rp-labs-title">
        <div className="rp-labs-head">
          <h2 id="rp-labs-title" className="rp-labs-title">The Labs</h2>
          <span className="rp-labs-sub">nine you'll see most · tap to filter</span>
        </div>
        <p className="rp-labs-intro">
          Most launches in this feed come from the same handful of labs. Here's who they are, where
          they're based, and what they're actually known for — so the org chips below stop being acronym soup.
        </p>
        <div className="rp-labs-grid">
          {LAB_PROFILES.map((lab) => {
            const count = orgCounts[lab.name] ?? 0;
            const inFeed = sorted.some((l) => l.org === lab.name);
            const isActive = activeOrg === lab.name;
            const color = ORG_COLORS[lab.name] || "#888";
            return (
              <button
                key={lab.name}
                className={`rp-lab-card ${isActive ? "rp-lab-card--active" : ""} ${!inFeed ? "rp-lab-card--quiet" : ""}`}
                onClick={() => inFeed && toggleOrg(lab.name)}
                disabled={!inFeed}
                aria-pressed={isActive}
                title={inFeed ? `Filter to ${lab.name}` : `${lab.name} — no launches tracked yet`}
                style={{ borderTopColor: color }}
              >
                <div className="rp-lab-head">
                  <span className="rp-lab-name" style={{ color }}>{lab.name}</span>
                  <span className="rp-lab-flag" aria-hidden="true">{lab.flag}</span>
                </div>
                <div className="rp-lab-meta">
                  <span>est. {lab.founded}</span>
                  <span className="rp-lab-meta-sep">·</span>
                  <span>{lab.hq}</span>
                </div>
                <p className="rp-lab-oneline">{lab.oneLine}</p>
                <div className="rp-lab-foot">
                  <span className={`rp-lab-stance rp-lab-stance--${lab.stance}`}>
                    {STANCE_LABELS[lab.stance]}
                  </span>
                  {inFeed && (
                    <span className="rp-lab-count">
                      {count > 0 ? `${count} in feed` : "in feed"}
                    </span>
                  )}
                </div>
                <p className="rp-lab-sig">{lab.signature}</p>
              </button>
            );
          })}
        </div>
        <p className="rp-labs-foot">
          Plenty of others ship too — Cursor, GitHub, Cloudflare, Midjourney, Hugging Face, Runway,
          ByteDance, MiniMax, Z.ai. They show up in the chips below as their launches land.
        </p>
      </section>

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

      <section className="rp-about" aria-labelledby="rp-about-title">
        <h2 id="rp-about-title" className="rp-about-title">About this radar</h2>
        <p className="rp-about-intro">
          A hand-curated log of AI launches that actually move the field — new flagship models,
          agentic products, developer APIs, and infrastructure shifts. No press releases.
          No minor patches. No prerelease beta noise.
        </p>

        <div className="rp-about-types">
          <div className="rp-about-type">
            <span className="rp-about-type-label">MODEL</span>
            <span className="rp-about-type-desc">A new foundation model — capabilities, benchmarks, pricing.</span>
          </div>
          <div className="rp-about-type">
            <span className="rp-about-type-label">PRODUCT</span>
            <span className="rp-about-type-desc">A consumer-facing app or feature — what users actually touch.</span>
          </div>
          <div className="rp-about-type">
            <span className="rp-about-type-label">TOOL</span>
            <span className="rp-about-type-desc">A developer-facing API or capability — what builders plug into.</span>
          </div>
          <div className="rp-about-type">
            <span className="rp-about-type-label">INFRA</span>
            <span className="rp-about-type-desc">Hardware, platforms, or backbone — chips, cloud, the rails.</span>
          </div>
        </div>

        <dl className="rp-about-meta">
          <div className="rp-about-meta-row">
            <dt>Updated</dt>
            <dd>Daily — new entries land when something ships.</dd>
          </div>
          <div className="rp-about-meta-row">
            <dt>Sources</dt>
            <dd>Official announcements first, trusted reporting second.</dd>
          </div>
          <div className="rp-about-meta-row">
            <dt>Suggest</dt>
            <dd>
              Spot something missing?{" "}
              <a href="mailto:stephen@stanwood.dev?subject=AI Radar suggestion">email it in</a>.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="rp-footer">
        <span>curated by stanwood.dev</span>
        <span>signal over noise</span>
      </footer>
    </div>
  );
}
