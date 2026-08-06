import { useState } from "react";
import { companies } from "../../data/driverless/data";
import PanelHeader from "./PanelHeader";
import FilterPill, { FilterPillRow } from "./FilterPill";

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
      <PanelHeader title="Who's Driving" subtitle="The companies building self-driving cars" />

      {/* Status filters */}
      <FilterPillRow>
        <FilterPill
          active={activeStatus === null}
          color="var(--dl-ink)"
          background="var(--dl-ink)"
          activeInk="#fff"
          onClick={() => setActiveStatus(null)}
        >
          All {companies.length}
        </FilterPill>
        {ALL_STATUSES.filter((s) => countOf(s) > 0).map((s) => {
          const { color, bg } = statusColors[s];
          const isActive = activeStatus === s;
          return (
            <FilterPill
              key={s}
              active={isActive}
              color={color}
              background={bg}
              count={countOf(s)}
              onClick={() => setActiveStatus(isActive ? null : s)}
            >
              {statusLabels[s]}
            </FilterPill>
          );
        })}
      </FilterPillRow>

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
