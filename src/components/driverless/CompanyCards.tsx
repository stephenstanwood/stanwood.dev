import { useState } from "react";
import { companies } from "../../data/driverless/data";

type Status = "active" | "testing" | "shut-down" | "l2-only";

const statusLabels: Record<Status, string> = {
  active: "On the Road",
  testing: "Testing",
  "shut-down": "Shut Down",
  "l2-only": "Not Driverless",
};

const statusColors: Record<Status, { color: string; bg: string }> = {
  active: { color: "var(--dl-accent)", bg: "var(--dl-accent-light)" },
  testing: { color: "var(--dl-amber)", bg: "#fffbeb" },
  "shut-down": { color: "var(--dl-red)", bg: "#fef2f2" },
  "l2-only": { color: "var(--dl-blue)", bg: "#f0f4ff" },
};

const ALL_STATUSES: Status[] = ["active", "testing", "shut-down", "l2-only"];

export default function CompanyCards() {
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);

  const filtered = activeStatus ? companies.filter((c) => c.status === activeStatus) : companies;
  const countOf = (s: Status) => companies.filter((c) => c.status === s).length;

  return (
    <div className="dl-panel dl-full">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">Who's Driving</h2>
        <span className="dl-panel-subtitle">The companies building self-driving cars</span>
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveStatus(null)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 6,
            border: "1.5px solid",
            cursor: "pointer",
            transition: "all 0.12s",
            borderColor: activeStatus === null ? "var(--dl-ink)" : "var(--dl-border)",
            background: activeStatus === null ? "var(--dl-ink)" : "transparent",
            color: activeStatus === null ? "#fff" : "var(--dl-muted)",
          }}
        >
          All {companies.length}
        </button>
        {ALL_STATUSES.filter((s) => countOf(s) > 0).map((s) => {
          const { color, bg } = statusColors[s];
          const isActive = activeStatus === s;
          return (
            <button
              key={s}
              onClick={() => setActiveStatus(isActive ? null : s)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 6,
                border: "1.5px solid",
                cursor: "pointer",
                transition: "all 0.12s",
                borderColor: isActive ? color : "var(--dl-border)",
                background: isActive ? bg : "transparent",
                color: isActive ? color : "var(--dl-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {statusLabels[s]}
              <span style={{
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                background: isActive ? color : "var(--dl-border)",
                color: isActive ? "#fff" : "var(--dl-muted)",
                borderRadius: 10,
                padding: "1px 6px",
                lineHeight: 1.4,
              }}>{countOf(s)}</span>
            </button>
          );
        })}
      </div>

      <div className="dl-company-grid">
        {filtered.map((c) => (
          <div key={c.name} className="dl-company-card">
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="dl-company-name">{c.name}</span>
                <span className={`dl-badge ${c.status}`}>{statusLabels[c.status]}</span>
              </div>
              <div className="dl-company-type">{c.type}</div>
              {c.vehicles != null && (
                <div className="dl-company-cities" style={{ color: "var(--dl-ink)", fontWeight: 500 }}>
                  {c.vehicles.toLocaleString()} vehicles
                </div>
              )}
              {c.cities.length > 0 && (
                <div className="dl-company-cities">{c.cities.join(" · ")}</div>
              )}
              {c.note && <div className="dl-company-note">{c.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
