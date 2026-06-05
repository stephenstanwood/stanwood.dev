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

const TABS: { id: Section; label: string; icon: string }[] = [
  { id: "links", label: "Start", icon: "↗" },
  { id: "history", label: "History", icon: "○" },
  { id: "digest", label: "Hearings", icon: "§" },
  { id: "safety", label: "Safety", icon: "!" },
  { id: "events", label: "Events", icon: "◇" },
  { id: "businesses", label: "Businesses", icon: "□" },
  { id: "homes", label: "Homes", icon: "⌂" },
  { id: "data", label: "Data", icon: "#" },
  { id: "roadmap", label: "Roadmap", icon: "✓" },
];

export default function CampbellPortal() {
  const [active, setActive] = useState<Section>("events");

  return (
    <div className="cb-portal">
      <nav className="cb-tabs" aria-label="Campbell sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`cb-tab ${active === tab.id ? "cb-tab--active" : ""}`}
            aria-pressed={active === tab.id}
            onClick={() => setActive(tab.id)}
          >
            <span className="cb-tab-icon">{tab.icon}</span>
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
