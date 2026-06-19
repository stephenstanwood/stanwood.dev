import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const TABS: { id: Section; label: string; eyebrow: string; summary: string; intent: string }[] = [
  {
    id: "events",
    label: "Events",
    eyebrow: "Today + weekend",
    summary: "Find today's plans, weekend options, public meetings, and original calendar links.",
    intent: "Use this when you are deciding what to do next.",
  },
  {
    id: "digest",
    label: "City Hall",
    eyebrow: "Hearings + packets",
    summary: "Open public notices, Council packets, minutes, videos, and plain-English summaries.",
    intent: "Use this before a meeting, hearing, or local decision.",
  },
  {
    id: "businesses",
    label: "Businesses",
    eyebrow: "Storefronts",
    summary: "Look up downtown shops, Chamber members, restaurants, services, and website links.",
    intent: "Use this when you need a local place, owner, or storefront link.",
  },
  {
    id: "safety",
    label: "Safety",
    eyebrow: "Official paths",
    summary: "Find police logs, crime maps, records requests, reporting links, and oversight pages.",
    intent: "Use this when you need the official public-safety route.",
  },
  {
    id: "homes",
    label: "Homes + Permits",
    eyebrow: "Property",
    summary: "Check permits, parcels, project maps, county records, and development links.",
    intent: "Use this when a property, project, or permit is the question.",
  },
  {
    id: "history",
    label: "History",
    eyebrow: "Orchard City",
    summary: "Follow Ainsley House, downtown roots, the water tower, and local milestones.",
    intent: "Use this for the local context behind Campbell's landmarks.",
  },
  {
    id: "data",
    label: "Numbers + Maps",
    eyebrow: "Numbers",
    summary: "Open Census snapshots, city maps, budgets, GIS layers, and county data.",
    intent: "Use this when you need sourced numbers or a map layer.",
  },
  {
    id: "links",
    label: "Resident Links",
    eyebrow: "Get it done",
    summary: "Jump to forms for services, permits, recreation, schools, transit, and help.",
    intent: "Use this when you already know the task and need the right form.",
  },
];

type TabAccent = "green" | "blue" | "clay" | "red" | "gold";

const TAB_META: Record<Section, { accent: TabAccent; image?: { src: string; objectPosition?: string } }> = {
  events: { accent: "green", image: { src: "/images/campbell/farmers-market.webp", objectPosition: "50% 38%" } },
  digest: { accent: "blue", image: { src: "/images/campbell/city-hall.webp", objectPosition: "50% 48%" } },
  businesses: { accent: "clay", image: { src: "/images/campbell/pruneyard-aerial.webp", objectPosition: "50% 42%" } },
  safety: { accent: "red", image: { src: "/images/campbell/city-hall.webp", objectPosition: "50% 48%" } },
  homes: { accent: "gold", image: { src: "/images/campbell/water-tower-aerial.webp", objectPosition: "50% 30%" } },
  history: { accent: "gold", image: { src: "/images/campbell/ainsley-house.webp", objectPosition: "50% 55%" } },
  data: { accent: "blue", image: { src: "/images/campbell/downtown-vta-station.webp", objectPosition: "50% 58%" } },
  links: { accent: "green", image: { src: "/images/campbell/campbell-park.webp", objectPosition: "28% 55%" } },
};

const SECTION_HASHES: Record<string, Section> = {
  "#campbell-events": "events",
  "#campbell-events-next14": "events",
  "#campbell-digest": "digest",
  "#campbell-businesses": "businesses",
  "#campbell-safety": "safety",
  "#campbell-homes": "homes",
  "#campbell-history": "history",
  "#campbell-data": "data",
  "#campbell-links": "links",
  "#campbell-routing": "links",
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

  useEffect(() => {
    const rail = tabRailRef.current;
    const activeButton = tabButtonRefs.current[activeIndex];
    if (!rail || !activeButton) return;

    const frame = window.requestAnimationFrame(() => {
      const left = activeButton.offsetLeft - (rail.clientWidth - activeButton.clientWidth) / 2;
      rail.scrollTo({
        left: Math.max(0, left),
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex]);

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
              <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => scrollSections(1)} aria-label="Next sections">
              <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
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
              className={`cb-tab cb-accent-${TAB_META[tab.id].accent} ${active === tab.id ? "cb-tab--active" : ""}`}
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
          <strong>{activeTab.intent}</strong>
          <span>{activeTab.label}: {activeTab.summary}</span>
        </p>
      </section>

      <div
        className={`cb-content cb-accent-${TAB_META[activeTab.id].accent}`}
        id={panelId(activeTab.id)}
        role="tabpanel"
        aria-labelledby={tabId(activeTab.id)}
        tabIndex={-1}
      >
        <div
          className={`cb-panel-banner${TAB_META[activeTab.id].image ? "" : " cb-panel-banner--pattern"}`}
        >
          {TAB_META[activeTab.id].image && (
            <img
              src={TAB_META[activeTab.id].image!.src}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ objectPosition: TAB_META[activeTab.id].image!.objectPosition }}
            />
          )}
          <div className="cb-panel-banner-copy">
            <span>
              {String(activeIndex + 1).padStart(2, "0")} · {activeTab.eyebrow}
            </span>
            <h2>{activeTab.label}</h2>
            <p>{activeTab.summary}</p>
          </div>
        </div>

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
