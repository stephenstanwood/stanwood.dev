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
  const availableTypes = [...new Set(sorted.map((l) => l.type))].filter(
    (t) => TYPE_LABELS[t]
  );

  const latest = sorted[0];
  const grouped = groupByDate(sorted);

  // Count badges: type and org counts, both from the full dataset.
  const typeCounts: Record<string, number> = {};
  for (const l of sorted) typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
  const orgCounts: Record<string, number> = {};
  for (const l of sorted) orgCounts[l.org] = (orgCounts[l.org] || 0) + 1;

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

  const tells: { emoji: string; name: string; watch: string; means: string }[] = [
    {
      emoji: "🎯",
      name: "Benchmark cherry-picking",
      watch: "Charts that only show the benchmarks they win. Comparisons against last year's model, not this week's.",
      means: "Real on a narrow slice — often weaker on the harder evals (GPQA, ARC-AGI, Humanity's Last Exam) that didn't make the slide.",
    },
    {
      emoji: "🚀",
      name: "Available soon vs. now",
      watch: "\"Rolling out over the coming weeks.\" Waitlists. A blog post but no API page, no pricing, no model ID.",
      means: "Marketing landed today; the product might land later. Treat the date as when it became real to journalists, not to you.",
    },
    {
      emoji: "💰",
      name: "Cheaper, dressed as a leap",
      watch: "Headlines built on \"10× cheaper\" or \"3× faster\" with no matching jump on capability evals.",
      means: "Big win if you're spending on inference. Not a new ceiling — same model territory at a better price.",
    },
    {
      emoji: "🎬",
      name: "Demo magic vs. ship",
      watch: "Highlight reels, narrator voiceover, \"hand-picked examples,\" only logged-out demos.",
      means: "Stage version ≠ API version. The cherry-picked scene is the ceiling, not the median run you'll get.",
    },
    {
      emoji: "🪪",
      name: "Open-weights ≠ open-source",
      watch: "\"Llama community license,\" commercial caps (\"700M monthly users\"), custom acceptable-use clauses.",
      means: "Free to download. Not free to ship. Read the license before betting a product on a model.",
    },
    {
      emoji: "📋",
      name: "Model card vs. blog post",
      watch: "Performance claims with no methodology. \"Internal evals\" footnotes. No system card on launch day.",
      means: "If they didn't publish the eval setup, the numbers are vibes. Wait a week for independent runs (Artificial Analysis, LMSYS).",
    },
  ];

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
              <div className="rp-pulse-stat">
                <div
                  className="rp-pulse-num rp-pulse-num--text"
                  style={{ color: ORG_COLORS[pulse.topOrg.name] || "var(--rp-ink)" }}
                >
                  {pulse.topOrg.name}
                </div>
                <div className="rp-pulse-label">on a tear</div>
                <div className="rp-pulse-foot">
                  {pulse.topOrg.count} in 30d
                </div>
              </div>
            )}
            {pulse.topType && (
              <div className="rp-pulse-stat">
                <div className="rp-pulse-num rp-pulse-num--text">
                  {TYPE_LABELS[pulse.topType.type] || "LAUNCH"}
                </div>
                <div className="rp-pulse-label">most this month</div>
                <div className="rp-pulse-foot">
                  {pulse.topType.count} of {pulse.totalLast30}
                </div>
              </div>
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
          <span className="rp-fieldmap-sub">what we track</span>
        </div>
        <div className="rp-fieldmap-grid">
          {fieldMapTypes.map(({ type, emoji, whatItIs, whyMatters }) => {
            const example = latestByType[type];
            const count = typeCounts[type] || 0;
            const hasExample = !!example;
            return (
              <article
                key={type}
                className={`rp-fieldmap-card rp-fieldmap-card--${type} ${!hasExample ? "rp-fieldmap-card--empty" : ""}`}
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
              </article>
            );
          })}
        </div>
      </section>

      {/* The Labs — who actually ships in this space */}
      <section className="rp-labs" aria-labelledby="rp-labs-title">
        <div className="rp-labs-head">
          <h2 id="rp-labs-title" className="rp-labs-title">The Labs</h2>
          <span className="rp-labs-sub">nine you'll see most</span>
        </div>
        <p className="rp-labs-intro">
          Most launches in this feed come from the same handful of labs. Here's who they are, where
          they're based, and what they're actually known for — so the org chips below stop being acronym soup.
        </p>
        <div className="rp-labs-grid">
          {LAB_PROFILES.map((lab) => {
            const count = orgCounts[lab.name] ?? 0;
            const inFeed = sorted.some((l) => l.org === lab.name);
            const color = ORG_COLORS[lab.name] || "#888";
            return (
              <article
                key={lab.name}
                className={`rp-lab-card ${!inFeed ? "rp-lab-card--quiet" : ""}`}
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
              </article>
            );
          })}
        </div>
        <p className="rp-labs-foot">
          Plenty of others ship too — Cursor, GitHub, Cloudflare, Midjourney, Hugging Face, Runway,
          ByteDance, MiniMax, Z.ai. They show up in the chips below as their launches land.
        </p>
      </section>

      {/* Signal vs. Noise — how to read a launch announcement */}
      <section className="rp-tells" aria-labelledby="rp-tells-title">
        <div className="rp-tells-head">
          <h2 id="rp-tells-title" className="rp-tells-title">Signal vs. Noise</h2>
          <span className="rp-tells-sub">six tells in AI launches · spot the spin fast</span>
        </div>
        <p className="rp-tells-intro">
          Most launches are real. Some are framing. These are the six tells that separate "actually
          ships" from "press release with a roadmap" — handy when a headline beats the feed below
          to your inbox.
        </p>
        <div className="rp-tells-grid">
          {tells.map((t) => (
            <article key={t.name} className="rp-tell-card">
              <div className="rp-tell-head">
                <span className="rp-tell-emoji" aria-hidden="true">{t.emoji}</span>
                <span className="rp-tell-name">{t.name}</span>
              </div>
              <p className="rp-tell-watch">
                <span className="rp-tell-label">watch for</span>
                {t.watch}
              </p>
              <p className="rp-tell-means">
                <span className="rp-tell-label">what it means</span>
                {t.means}
              </p>
            </article>
          ))}
        </div>
        <p className="rp-tells-foot">
          None of these mean a launch is fake — just that the spin is doing work. The feed below
          tries to flag the spin in the summary when it spots it.
        </p>
      </section>

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

      <section className="rp-about" aria-labelledby="rp-about-title">
        <h2 id="rp-about-title" className="rp-about-title">About this radar</h2>
        <p className="rp-about-intro">
          A hand-curated log of AI launches that actually move the field — new flagship models,
          agentic products, developer APIs, and infrastructure shifts. No press releases.
          No minor patches. No prerelease beta noise.
        </p>

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
