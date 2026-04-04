import HeroStats from "./HeroStats";
import USMap from "./USMap";
import SafetyChart from "./SafetyChart";
import GrowthChart from "./GrowthChart";
import CompanyCards from "./CompanyCards";
import StateBreakdown from "./StateBreakdown";
import DisengagementChart from "./DisengagementChart";
import AVTimeline from "./AVTimeline";

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

        {/* AV Timeline — full width */}
        <AVTimeline />
      </div>

      {/* Footer */}
      <footer className="dl-footer">
        <p>Last updated April 2026. All data is a point-in-time snapshot.</p>
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
