import HeroStats from "./HeroStats";
import USMap from "./USMap";
import SafetyChart from "./SafetyChart";
import GrowthChart from "./GrowthChart";
import CompanyCards from "./CompanyCards";
import StateBreakdown from "./StateBreakdown";
import DisengagementChart from "./DisengagementChart";

export default function DriverlessDashboard() {
  return (
    <div className="dl-page">
      {/* Header */}
      <header className="dl-header">
        <a href="/" className="dl-back">&larr; stanwood.dev</a>
        <h1 className="dl-title">Driverless</h1>
        <p className="dl-subtitle">Tracking the self-driving revolution across the US</p>
      </header>

      {/* Hero stats */}
      <HeroStats />

      {/* Main grid */}
      <div className="dl-grid">
        {/* Map — full width */}
        <USMap />

        {/* Safety + Growth side by side */}
        <SafetyChart />
        <GrowthChart />

        {/* Companies — full width */}
        <CompanyCards />

        {/* State breakdown — full width */}
        <StateBreakdown />

        {/* Disengagement + fun facts side by side */}
        <DisengagementChart />

        {/* Milestones panel */}
        <div className="dl-panel">
          <div className="dl-panel-header">
            <h2 className="dl-panel-title">Milestones</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "🎉", text: "20M+ Waymo rides taken so far" },
              { icon: "🛣️", text: "200M+ miles driven with no human at the wheel" },
              { icon: "🌍", text: "18M kg of CO\u2082 avoided in 2025 (the whole fleet is electric)" },
              { icon: "🏭", text: "Waymo is building a self-driving car factory in Mesa, AZ" },
              { icon: "🚀", text: "Waymo launched its newest vehicle hardware in Feb 2026" },
              { icon: "📈", text: "Targeting 1M rides/week by end of 2026" },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--dl-bg)",
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="dl-footer">
        <p>Last updated March 2026. All data is a point-in-time snapshot.</p>
        <p>
          Sources:{" "}
          <a href="https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting" target="_blank" rel="noopener noreferrer">NHTSA crash reports</a>,{" "}
          <a href="https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/disengagement-reports/" target="_blank" rel="noopener noreferrer">California DMV</a>,{" "}
          <a href="https://www.fhwa.dot.gov/policyinformation/statistics/2023/mv1.cfm" target="_blank" rel="noopener noreferrer">Federal Highway Administration</a>,{" "}
          <a href="https://www.ncsl.org/transportation/autonomous-vehicles" target="_blank" rel="noopener noreferrer">National Conference of State Legislatures</a>,{" "}
          <a href="https://waymo.com/safety/impact/" target="_blank" rel="noopener noreferrer">Waymo safety data</a>
        </p>
      </footer>
    </div>
  );
}
