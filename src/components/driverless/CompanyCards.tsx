import { companies } from "../../data/driverless/data";

const statusLabels: Record<string, string> = {
  active: "On the Road",
  testing: "Testing",
  "shut-down": "Shut Down",
  "l2-only": "Not Driverless",
};

export default function CompanyCards() {
  return (
    <div className="dl-panel dl-full">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">Who's Driving</h2>
        <span className="dl-panel-subtitle">The companies building self-driving cars</span>
      </div>
      <div className="dl-company-grid">
        {companies.map((c) => (
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
