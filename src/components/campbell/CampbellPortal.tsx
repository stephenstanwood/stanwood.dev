import { useState } from "react";
import type { Section } from "../../lib/campbell/types";
import QuickLinks from "./QuickLinks";
import CouncilDigest from "./CouncilDigest";
import ActivityFinder from "./ActivityFinder";
import EatLocal from "./EatLocal";
import CityData from "./CityData";

const TABS: { id: Section; label: string; icon: string }[] = [
  { id: "links", label: "Quick Links", icon: "🔗" },
  { id: "digest", label: "Council Digest", icon: "📰" },
  { id: "activities", label: "Activities", icon: "🏊" },
  { id: "eat", label: "Eat Local", icon: "🍕" },
  { id: "data", label: "City Data", icon: "📊" },
];

export default function CampbellPortal() {
  const [active, setActive] = useState<Section>("links");

  return (
    <div className="cb-portal">
      <div className="cb-intro">
        <p>
          Quick links, council meeting summaries, local restaurants, recreation activities, and public data for Campbell residents.
        </p>
      </div>

      <nav className="cb-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`cb-tab ${active === tab.id ? "cb-tab--active" : ""}`}
            onClick={() => setActive(tab.id)}
          >
            <span className="cb-tab-icon">{tab.icon}</span>
            <span className="cb-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="cb-content">
        {active === "links" && <QuickLinks />}
        {active === "digest" && <CouncilDigest />}
        {active === "activities" && <ActivityFinder />}
        {active === "eat" && <EatLocal />}
        {active === "data" && <CityData />}
      </div>
    </div>
  );
}
