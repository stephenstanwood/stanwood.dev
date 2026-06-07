import { useEffect, useRef, useState } from "react";
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
import TodayInCampbell from "./TodayInCampbell";

const TABS: { id: Section; label: string; eyebrow: string; summary: string }[] = [
  {
    id: "events",
    label: "Events",
    eyebrow: "Today + weekend",
    summary: "City, downtown, library, museum, theater, Chamber, and school-board dates.",
  },
  {
    id: "digest",
    label: "Hearings",
    eyebrow: "Plain English",
    summary: "Public notices, Council packets, minutes, and what they mean for residents.",
  },
  {
    id: "businesses",
    label: "Businesses",
    eyebrow: "Storefronts",
    summary: "Downtown, Chamber, shopping, dining, services, addresses, and website links.",
  },
  {
    id: "safety",
    label: "Safety",
    eyebrow: "Official paths",
    summary: "Police logs, crime map, records requests, reporting links, and oversight pages.",
  },
  {
    id: "homes",
    label: "Homes",
    eyebrow: "Property",
    summary: "Permits, planning projects, parcel lookups, sale-record limits, and maps.",
  },
  {
    id: "history",
    label: "History",
    eyebrow: "Orchard City",
    summary: "Ainsley House, incorporation, downtown roots, and local milestones.",
  },
  {
    id: "data",
    label: "Data",
    eyebrow: "Numbers",
    summary: "Census snapshots, city maps, budgets, GIS, and county data.",
  },
  {
    id: "links",
    label: "Resident Links",
    eyebrow: "Get it done",
    summary: "Forms and shortcuts for services, utilities, permits, schools, transit, and help.",
  },
];

const SECTION_HASHES: Record<string, Section> = {
  "#campbell-events": "events",
  "#campbell-digest": "digest",
  "#campbell-businesses": "businesses",
  "#campbell-safety": "safety",
  "#campbell-homes": "homes",
  "#campbell-history": "history",
  "#campbell-data": "data",
  "#campbell-links": "links",
};

function sectionFromHash(hash: string) {
  return SECTION_HASHES[hash.toLowerCase()] ?? null;
}

export default function CampbellPortal() {
  const [active, setActive] = useState<Section>("events");
  const tabRailRef = useRef<HTMLElement>(null);
  const activeIndex = TABS.findIndex((tab) => tab.id === active);

  useEffect(() => {
    function syncHashSection() {
      const section = sectionFromHash(window.location.hash);
      if (section) setActive(section);
    }

    syncHashSection();
    window.addEventListener("hashchange", syncHashSection);
    return () => window.removeEventListener("hashchange", syncHashSection);
  }, []);

  function selectSection(section: Section) {
    setActive(section);
    if (typeof window === "undefined") return;

    const nextHash = `#campbell-${section}`;
    if (window.location.hash === nextHash) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }

  function scrollSections(direction: -1 | 1) {
    const rail = tabRailRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(300, rail.clientWidth * 0.82),
      behavior: "smooth",
    });
  }

  return (
    <div className="cb-portal">
      <section className="cb-tabs-shell" aria-label="Browse Campbell guide sections">
        <div className="cb-tabs-head">
          <div>
            <span>Browse Campbell</span>
            <h2>Start anywhere.</h2>
          </div>
          <div className="cb-tabs-controls" aria-label="Scroll section list">
            <button type="button" onClick={() => scrollSections(-1)} aria-label="Previous sections">
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={() => scrollSections(1)} aria-label="Next sections">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <nav className="cb-tabs" aria-label="Campbell sections" ref={tabRailRef}>
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              className={`cb-tab ${active === tab.id ? "cb-tab--active" : ""}`}
              aria-pressed={active === tab.id}
              onClick={() => selectSection(tab.id)}
            >
              <span className="cb-tab-topline">
                <span className="cb-tab-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="cb-tab-eyebrow">{tab.eyebrow}</span>
              </span>
              <span className="cb-tab-label">{tab.label}</span>
              <span className="cb-tab-summary">{tab.summary}</span>
            </button>
          ))}
        </nav>

        <p className="cb-tabs-footer">
          {TABS[activeIndex]?.label}: {TABS[activeIndex]?.summary}
        </p>
      </section>

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
        {active === "events" && (
          <div className="cb-stack">
            <TodayInCampbell />
            <EventsIndex />
          </div>
        )}
        {active === "businesses" && <BusinessIndex />}
        {active === "homes" && <RealEstateLedger />}
        {active === "data" && <CityData />}
      </div>
    </div>
  );
}
