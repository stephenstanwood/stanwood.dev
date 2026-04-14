import HeroStats from "./HeroStats";
import RideFinder from "./RideFinder";
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

      {/* Milestone callout */}
      <div className="dl-milestone">
        <div className="dl-milestone-tag">March 2026 milestone</div>
        <p className="dl-milestone-headline">Waymo hits 500,000 rides/week</p>
        <p className="dl-milestone-body">
          The first self-driving company to reach commercial scale — operating fully driverless across San Francisco, Los Angeles, Phoenix, and Austin. Aurora launched driverless freight on I-45 the same month. The AV industry has now logged 200M+ miles without a human at the wheel.
        </p>
      </div>

      {/* Key context */}
      <div className="dl-context">
        <p className="dl-context-label">Reading this dashboard</p>
        <div className="dl-context-grid">
          <div className="dl-context-item">
            <span className="dl-context-term">Disengagement rate</span>
            <span className="dl-context-def">How often a human had to override the AV per 1,000 miles. Lower is better — it measures how reliably the system handles real-world conditions without intervention.</span>
          </div>
          <div className="dl-context-item">
            <span className="dl-context-term">Driverless miles</span>
            <span className="dl-context-def">Miles logged with zero safety driver present. The gold standard metric — it proves the system can operate entirely on its own at scale.</span>
          </div>
          <div className="dl-context-item">
            <span className="dl-context-term">Level 4 vs L2+</span>
            <span className="dl-context-def">Level 4 means fully autonomous within a defined area — no human needed. L2+ (like Tesla FSD) still requires a licensed driver ready to take over at any moment.</span>
          </div>
          <div className="dl-context-item">
            <span className="dl-context-term">Permit status</span>
            <span className="dl-context-def">States issue permits in tiers: testing (safety driver required), driverless testing, and commercial deployment. Each tier requires a separate application and safety data review.</span>
          </div>
        </div>
      </div>

      {/* Hero stats */}
      <HeroStats />

      {/* Main grid */}
      <div className="dl-grid">
        {/* Ride finder — full width, top of grid */}
        <RideFinder />
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
