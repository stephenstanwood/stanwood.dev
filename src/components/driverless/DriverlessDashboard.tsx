import HeroStats from "./HeroStats";
import RideFinder from "./RideFinder";
import USMap from "./USMap";
import SafetyChart from "./SafetyChart";
import GrowthChart from "./GrowthChart";
import CompanyCards from "./CompanyCards";
import StateBreakdown from "./StateBreakdown";
import DisengagementChart from "./DisengagementChart";
import L4Race from "./L4Race";
import FirstRide from "./FirstRide";
import Limits from "./Limits";
import Myths from "./Myths";
import SensorStack from "./SensorStack";
import AVTimeline from "./AVTimeline";

export default function DriverlessDashboard() {
  return (
    <div className="dl-page">
      <a href="/" className="dl-back">&larr; stanwood.dev</a>

      {/* Hero image */}
      <div className="dl-hero-img">
        <img
          src="/images/self-driving.webp"
          alt="Driverless robotaxi waiting at a curb with no one in the driver's seat"
          loading="eager"
          decoding="async"
          width="1456"
          height="546"
        />
        <div className="dl-hero-overlay">
          <h1 className="dl-hero-overlay-title">Driverless</h1>
          <span className="dl-hero-overlay-sub">july 2026 snapshot · self-driving by the numbers</span>
        </div>
      </div>

      {/* Header */}
      <header className="dl-header">
        <p className="dl-subtitle">A snapshot of the autonomous-vehicle landscape as of July 2026 — fleets, safety data, where you can ride today, and what's coming next.</p>
      </header>

      {/* Built for moments like */}
      <section className="dl-forwhen" aria-label="Who this dashboard is for">
        <p className="dl-forwhen-label">Built for moments like</p>
        <div className="dl-forwhen-grid">
          <div className="dl-forwhen-card">
            <span className="dl-forwhen-num">01</span>
            <p className="dl-forwhen-text"><strong>Your first robotaxi ride</strong> <span>— what to expect when the car shows up with no one in it, and which service to try first in your city.</span></p>
          </div>
          <div className="dl-forwhen-card">
            <span className="dl-forwhen-num">02</span>
            <p className="dl-forwhen-text"><strong>The dinner-table argument</strong> <span>— a fact-checked answer to "are these things actually safe?" with the real numbers and sources.</span></p>
          </div>
          <div className="dl-forwhen-card">
            <span className="dl-forwhen-num">03</span>
            <p className="dl-forwhen-text"><strong>Watching the buildout</strong> <span>— which states allow what, who's racing Waymo, and when the next city is likely to flip on.</span></p>
          </div>
          <div className="dl-forwhen-card">
            <span className="dl-forwhen-num">04</span>
            <p className="dl-forwhen-text"><strong>Cutting through the hype</strong> <span>— Tesla FSD vs. Waymo, L2+ vs. L4, and what "driverless" actually means in 2026.</span></p>
          </div>
        </div>
      </section>

      {/* Milestone callout */}
      <div className="dl-milestone">
        <div className="dl-milestone-tag">June 2026 milestone</div>
        <p className="dl-milestone-headline">Tesla robotaxis now cover all of Austin</p>
        <p className="dl-milestone-body">
          On June 3, Tesla opened its unsupervised Cybercab rides across the entire Austin metro — about 245 square miles — with no safety monitor in the car, though only a small fleet of roughly 20 vehicles serves it so far. The same season, Waymo opened its seventh metro in Nashville and held steady at about 500K paid rides a week. Four companies now run commercial driverless service in the US: Waymo, Tesla, Zoox, and Aurora's freight trucks.
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

        {/* First ride walkthrough — full width */}
        <FirstRide />

        {/* Limits — full width */}
        <Limits />

        {/* Myths — full width */}
        <Myths />

        {/* Sensor stack — full width, pairs with Tesla-vs-Waymo angle */}
        <SensorStack />

        {/* L4 Race — full width */}
        <L4Race />

        {/* State breakdown — full width */}
        <StateBreakdown />

        {/* Disengagement + fun facts side by side */}
        <DisengagementChart />

        {/* AV Timeline — full width */}
        <AVTimeline />
      </div>

      {/* Footer */}
      <footer className="dl-footer">
        <p>Last updated July 2026. All data is a point-in-time snapshot.</p>
        <p>
          Sources:{" "}
          <a href="https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting" target="_blank" rel="noopener noreferrer">NHTSA crash reports</a>,{" "}
          <a href="https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/california-autonomous-vehicle-regulations/" target="_blank" rel="noopener noreferrer">California DMV</a>,{" "}
          <a href="https://www.fhwa.dot.gov/policyinformation/statistics/2023/mv1.cfm" target="_blank" rel="noopener noreferrer">Federal Highway Administration</a>,{" "}
          <a href="https://www.ncsl.org/transportation/autonomous-vehicles" target="_blank" rel="noopener noreferrer">National Conference of State Legislatures</a>,{" "}
          <a href="https://waymo.com/safety/impact/" target="_blank" rel="noopener noreferrer">Waymo safety data</a>
        </p>
      </footer>
    </div>
  );
}
