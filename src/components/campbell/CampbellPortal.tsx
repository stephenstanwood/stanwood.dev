import { type KeyboardEvent, useEffect, useRef, useState } from "react";
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

function tabId(section: Section) {
  return `campbell-tab-${section}`;
}

function panelId(section: Section) {
  return `campbell-panel-${section}`;
}

function sectionFromHash(hash: string) {
  return SECTION_HASHES[hash.toLowerCase()] ?? null;
}

export default function CampbellPortal() {
  const [active, setActive] = useState<Section>("events");
  const tabRailRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = TABS.findIndex((tab) => tab.id === active);
  const activeTab = TABS[activeIndex] ?? TABS[0];

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

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = TABS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    selectSection(nextTab.id);
    tabButtonRefs.current[nextIndex]?.focus();
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

        <div className="cb-tabs" role="tablist" aria-label="Campbell sections" ref={tabRailRef}>
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              id={tabId(tab.id)}
              type="button"
              role="tab"
              className={`cb-tab ${active === tab.id ? "cb-tab--active" : ""}`}
              aria-selected={active === tab.id}
              aria-controls={panelId(tab.id)}
              tabIndex={active === tab.id ? 0 : -1}
              ref={(button) => {
                tabButtonRefs.current[index] = button;
              }}
              onClick={() => selectSection(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span className="cb-tab-topline">
                <span className="cb-tab-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="cb-tab-eyebrow">{tab.eyebrow}</span>
              </span>
              <span className="cb-tab-label">{tab.label}</span>
              <span className="cb-tab-summary">{tab.summary}</span>
            </button>
          ))}
        </div>

        <p className="cb-tabs-footer">
          {activeTab.label}: {activeTab.summary}
        </p>
      </section>

      <div
        className="cb-content"
        id={panelId(activeTab.id)}
        role="tabpanel"
        aria-labelledby={tabId(activeTab.id)}
        tabIndex={-1}
      >
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
