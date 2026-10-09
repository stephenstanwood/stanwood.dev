import { lazy, Suspense } from "react";
import HeroStats from "./HeroStats";
import RideFinder from "./RideFinder";
import CompanyCards from "./CompanyCards";
import StateBreakdown from "./StateBreakdown";
import L4Race from "./L4Race";
import FirstRide from "./FirstRide";
import Limits from "./Limits";
import Myths from "./Myths";
import SensorStack from "./SensorStack";
import AVTimeline from "./AVTimeline";

const USMap = lazy(() => import("./USMap"));
const SafetyChart = lazy(() => import("./SafetyChart"));
const GrowthChart = lazy(() => import("./GrowthChart"));
const DisengagementChart = lazy(() => import("./DisengagementChart"));

/** The month this whole page describes. The monthly refresh task moves this one string;
 *  the milestone tag below names a specific event and is dated separately on purpose. */
const SNAPSHOT_MONTH = "September 2026";

const FOR_WHEN = [
  {
    title: "Your first robotaxi ride",
    body: "what to expect when the car shows up with no one in it, and which service to try first in your city.",
  },
  {
    title: "The dinner-table argument",
    body: 'a fact-checked answer to "are these things actually safe?" with the real numbers and sources.',
  },
  {
    title: "Watching the buildout",
    body: "which states allow what, who's racing Waymo, and when the next city is likely to flip on.",
  },
  {
    title: "Cutting through the hype",
    body: 'Tesla FSD vs. Waymo, L2+ vs. L4, and what "driverless" actually means in 2026.',
  },
];

const GLOSSARY = [
  {
    term: "Disengagement rate",
    definition:
      "How often a human had to override the AV per 1,000 miles. Lower is better — it measures how reliably the system handles real-world conditions without intervention.",
  },
  {
    term: "Driverless miles",
    definition:
      "Miles logged with zero safety driver present. The gold standard metric — it proves the system can operate entirely on its own at scale.",
  },
  {
    term: "Level 4 vs L2+",
    definition:
      "Level 4 means fully autonomous within a defined area — no human needed. L2+ (like Tesla FSD) still requires a licensed driver ready to take over at any moment.",
  },
  {
    term: "Permit status",
    definition:
      "States issue permits in tiers: testing (safety driver required), driverless testing, and commercial deployment. Each tier requires a separate application and safety data review.",
  },
];

function DeferredPanelFallback({ full = false }: { full?: boolean }) {
  return (
    <div className={`dl-panel${full ? " dl-full" : ""}`} aria-hidden="true">
      <div className="dl-panel-header">
        <span className="dl-skeleton dl-skeleton-title" />
        <span className="dl-skeleton dl-skeleton-meta" />
      </div>
      <div className="dl-chart-placeholder" />
    </div>
  );
}

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
          <span className="dl-hero-overlay-sub">{SNAPSHOT_MONTH.toLowerCase()} snapshot · self-driving by the numbers</span>
        </div>
      </div>

      {/* Header */}
      <header className="dl-header">
        <p className="dl-subtitle">A snapshot of the autonomous-vehicle landscape as of {SNAPSHOT_MONTH} — fleets, safety data, where you can ride today, and what's coming next.</p>
      </header>

      {/* Built for moments like */}
      <section className="dl-forwhen" aria-label="Who this dashboard is for">
        <p className="dl-forwhen-label">Built for moments like</p>
        <div className="dl-forwhen-grid">
          {FOR_WHEN.map((moment, index) => (
            <div className="dl-forwhen-card" key={moment.title}>
              <span className="dl-forwhen-num">{String(index + 1).padStart(2, "0")}</span>
              <p className="dl-forwhen-text"><strong>{moment.title}</strong> <span>— {moment.body}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* Milestone callout */}
      <div className="dl-milestone">
        <div className="dl-milestone-tag">August 2026 milestone</div>
        <p className="dl-milestone-headline">A car with no steering wheel starts charging fares</p>
        <p className="dl-milestone-body">
          Federal safety rules have always assumed a person could grab the wheel. In July, regulators granted Zoox the first commercial exemption ever given to a purpose-built robotaxi — no steering wheel, no pedals — and paid rides started on the Las Vegas Strip in August. Waymo opened Dallas and Houston to every rider the same month, putting it in 11 metros, and Tesla now runs rides with nobody in the front seat in six.
        </p>
      </div>

      {/* Key context */}
      <div className="dl-context">
        <p className="dl-context-label">Reading this dashboard</p>
        <div className="dl-context-grid">
          {GLOSSARY.map((entry) => (
            <div className="dl-context-item" key={entry.term}>
              <span className="dl-context-term">{entry.term}</span>
              <span className="dl-context-def">{entry.definition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero stats */}
      <HeroStats />

      {/* Main grid */}
      <div className="dl-grid">
        {/* Ride finder — full width, top of grid */}
        <RideFinder />
        {/* Map — full width */}
        <Suspense fallback={<DeferredPanelFallback full />}>
          <USMap />
        </Suspense>

        {/* Safety + Growth side by side */}
        <Suspense fallback={<DeferredPanelFallback />}>
          <SafetyChart />
        </Suspense>
        <Suspense fallback={<DeferredPanelFallback />}>
          <GrowthChart />
        </Suspense>

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
        <Suspense fallback={<DeferredPanelFallback full />}>
          <DisengagementChart />
        </Suspense>

        {/* AV Timeline — full width */}
        <AVTimeline />
      </div>

      {/* Footer */}
      <footer className="dl-footer">
        <p>Last updated {SNAPSHOT_MONTH}. All data is a point-in-time snapshot.</p>
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
