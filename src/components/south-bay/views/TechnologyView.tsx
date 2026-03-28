import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TECH_COMPANIES,
  TECH_PULSE,
  CATEGORY_LABELS,
  CHART_DATA,
  type TechCompany,
  type TechTrend,
} from "../../../data/south-bay/tech-companies";

// ── Tooltip for chart ──────────────────────────────────────────────────────

interface TooltipPayload {
  payload?: { name: string; headcount: number; trend: TechTrend };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const d = payload[0].payload;
  const trendColor =
    d.trend === "up" ? "#16a34a" : d.trend === "down" ? "#dc2626" : "#6b7280";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 4,
        padding: "8px 12px",
        fontSize: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        fontFamily: "var(--sb-sans)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: trendColor, fontWeight: 500 }}>
        ~{d.headcount.toLocaleString()}K employees (global est.)
      </div>
    </div>
  );
}

// ── Trend badge ────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: TechTrend }) {
  if (trend === "up")
    return (
      <span className="tech-trend tech-trend--up">▲ Growing</span>
    );
  if (trend === "down")
    return (
      <span className="tech-trend tech-trend--down">▼ Shrinking</span>
    );
  return <span className="tech-trend tech-trend--flat">— Stable</span>;
}

// ── Company card ───────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: TechCompany }) {
  return (
    <div className="tech-card">
      <div className="tech-card-top">
        <div className="tech-card-identity">
          <span className="tech-card-name">{company.name}</span>
          {company.ticker && company.ticker !== "MSFT" && company.ticker !== "HPE" && (
            <span className="tech-card-ticker">{company.ticker}</span>
          )}
        </div>
        <TrendBadge trend={company.trend} />
      </div>

      <div className="tech-card-meta">
        <span className="tech-card-city">{company.city}</span>
        <span className="tech-card-dot">·</span>
        <span className="tech-card-category">{CATEGORY_LABELS[company.category]}</span>
        <span className="tech-card-dot">·</span>
        <span className="tech-card-headcount">~{company.headcountK.toLocaleString()}K employees</span>
      </div>

      <p className="tech-card-desc">{company.description}</p>

      <div className="tech-card-trend-note">{company.trendNote}</div>

      <ul className="tech-card-highlights">
        {company.highlights.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export default function TechnologyView() {
  const sortedCompanies = [...TECH_COMPANIES].sort(
    (a, b) => b.headcountK - a.headcountK
  );

  return (
    <div className="tech-view">
      {/* ── Header ── */}
      <div className="tech-header">
        <div className="tech-header-eyebrow">South Bay</div>
        <h2 className="tech-header-title">Technology</h2>
        <p className="tech-header-subtitle">
          The companies headquartered in your backyard — from garage startups
          to the most valuable businesses in human history.
        </p>
        <div className="tech-header-note">
          Data snapshot · Q1 2026 · Global headcount estimates · Not affiliated with any company listed
        </div>
      </div>

      {/* ── Pulse strip ── */}
      <div className="tech-pulse">
        {TECH_PULSE.map((stat) => (
          <div key={stat.label} className="tech-pulse-item">
            <div className="tech-pulse-value">{stat.value}</div>
            <div className="tech-pulse-label">{stat.label}</div>
            <div className="tech-pulse-note">{stat.note}</div>
          </div>
        ))}
      </div>

      {/* ── Top Employers Chart ── */}
      <div className="tech-section">
        <div className="tech-section-head">
          <h3 className="tech-section-title">Top Employers</h3>
          <span className="tech-section-note">Global headcount, thousands · Top 10 by size</span>
        </div>

        <div className="tech-chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={CHART_DATA}
              layout="vertical"
              margin={{ top: 4, right: 48, bottom: 4, left: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#6b7280", fontFamily: "var(--sb-sans)" }}
                tickFormatter={(v) => `${v}K`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#374151", fontFamily: "var(--sb-sans)" }}
                width={76}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="headcount" radius={[0, 3, 3, 0]} maxBarSize={22}>
                {CHART_DATA.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    opacity={entry.trend === "down" ? 0.55 : 0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="tech-chart-legend">
          <span className="tech-legend-up">▲ Growing</span>
          <span className="tech-legend-down">▼ Shrinking (shown lighter)</span>
          <span className="tech-legend-note">Estimates only. Not investment advice.</span>
        </div>
      </div>

      {/* ── Company Grid ── */}
      <div className="tech-section">
        <div className="tech-section-head">
          <h3 className="tech-section-title">All Companies</h3>
          <span className="tech-section-note">Sorted by global headcount</span>
        </div>

        <div className="tech-grid">
          {sortedCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="tech-footer-note">
        Headcount figures are global estimates as of Q1 2026, sourced from company earnings reports,
        SEC filings, and news coverage. South Bay Signal is not affiliated with any company listed and
        this is not investment advice.
      </div>
    </div>
  );
}
