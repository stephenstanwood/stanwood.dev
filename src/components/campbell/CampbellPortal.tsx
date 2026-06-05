import { useState } from "react";
import type { Section } from "../../lib/campbell/types";
import QuickLinks from "./QuickLinks";
import CouncilDigest from "./CouncilDigest";
import CityData from "./CityData";
import HistoryTimeline from "./HistoryTimeline";
import CivicRecords from "./CivicRecords";
import SafetyIndex from "./SafetyIndex";
import EventsIndex from "./EventsIndex";
import BusinessIndex from "./BusinessIndex";
import RealEstateLedger from "./RealEstateLedger";
import CampbellRoadmap from "./CampbellRoadmap";
import TodayInCampbell from "./TodayInCampbell";

const TABS: { id: Section; label: string }[] = [
  { id: "events", label: "Events" },
  { id: "digest", label: "Hearings" },
  { id: "businesses", label: "Businesses" },
  { id: "safety", label: "Safety" },
  { id: "homes", label: "Homes" },
  { id: "history", label: "History" },
  { id: "data", label: "Data" },
  { id: "links", label: "Resident Links" },
  { id: "roadmap", label: "Roadmap" },
];

export default function CampbellPortal() {
  const [active, setActive] = useState<Section>("events");

  return (
    <div className="cb-portal">
      <TodayInCampbell />

      <nav className="cb-tabs" aria-label="Campbell sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`cb-tab ${active === tab.id ? "cb-tab--active" : ""}`}
            aria-pressed={active === tab.id}
            onClick={() => setActive(tab.id)}
          >
            <span className="cb-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="cb-content">
        {active === "links" && <QuickLinks />}
        {active === "history" && <HistoryTimeline />}
        {active === "digest" && (
          <div className="cb-stack">
            <CivicRecords />
            <CouncilDigest />
          </div>
        )}
        {active === "safety" && <SafetyIndex />}
        {active === "events" && <EventsIndex />}
        {active === "businesses" && <BusinessIndex />}
        {active === "homes" && <RealEstateLedger />}
        {active === "data" && <CityData />}
        {active === "roadmap" && <CampbellRoadmap />}
      </div>
    </div>
  );
}
