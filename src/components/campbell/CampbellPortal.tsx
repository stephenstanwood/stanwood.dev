import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  House,
  Landmark,
  Map,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";
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

type TabAccent = "green" | "blue" | "clay" | "red" | "gold";

type TabConfig = {
  id: Section;
  label: string;
  eyebrow: string;
  summary: string;
  Icon: LucideIcon;
  accent: TabAccent;
  image?: { src: string; objectPosition?: string };
};

const TABS: TabConfig[] = [
  {
    id: "events",
    label: "Events",
    eyebrow: "Today + weekend",
    summary: "Find events, weekend plans, and public meetings.",
    Icon: CalendarDays,
    accent: "green",
    image: { src: "/images/campbell/farmers-market.webp", objectPosition: "50% 38%" },
  },
  {
    id: "digest",
    label: "City Hall",
    eyebrow: "Hearings + packets",
    summary: "Follow hearings, council decisions, and meeting records.",
    Icon: Landmark,
    accent: "blue",
    image: { src: "/images/campbell/city-hall.webp", objectPosition: "50% 48%" },
  },
  {
    id: "businesses",
    label: "Businesses",
    eyebrow: "Storefronts",
    summary: "Look up local shops, restaurants, and services.",
    Icon: Store,
    accent: "clay",
    image: { src: "/images/campbell/pruneyard-aerial.webp", objectPosition: "50% 42%" },
  },
  {
    id: "safety",
    label: "Safety",
    eyebrow: "Police + reports",
    summary: "Report a problem or find police records and crime maps.",
    Icon: ShieldCheck,
    accent: "red",
    image: { src: "/images/campbell/city-hall.webp", objectPosition: "50% 48%" },
  },
  {
    id: "homes",
    label: "Homes + Permits",
    eyebrow: "Property",
    summary: "Check a property, permit, or proposed development.",
    Icon: House,
    accent: "gold",
    image: { src: "/images/campbell/water-tower-aerial.webp", objectPosition: "50% 30%" },
  },
  {
    id: "history",
    label: "History",
    eyebrow: "Orchard City",
    summary: "Explore Campbell's landmarks and orchard roots.",
    Icon: History,
    accent: "gold",
    image: { src: "/images/campbell/ainsley-house.webp", objectPosition: "50% 55%" },
  },
  {
    id: "data",
    label: "Numbers + Maps",
    eyebrow: "Numbers",
    summary: "Find census figures, city budgets, and local maps.",
    Icon: Map,
    accent: "blue",
    image: { src: "/images/campbell/downtown-vta-station.webp", objectPosition: "50% 58%" },
  },
  {
    id: "links",
    label: "Resident Links",
    eyebrow: "Get it done",
    summary: "Find services, forms, schools, recreation, and transit.",
    Icon: ClipboardList,
    accent: "green",
    image: { src: "/images/campbell/campbell-park.webp", objectPosition: "28% 55%" },
  },
];

const SECTION_HASHES: Record<string, Section> = {
  "#campbell-events": "events",
  "#campbell-events-next14": "events",
  "#campbell-events-weekend": "events",
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

function scrollHashTargetIntoView() {
  if (typeof window === "undefined") return;

  const targetId = window.location.hash.slice(1);
  if (!targetId) return;

  const target = document.getElementById(decodeURIComponent(targetId));
  if (target) target.scrollIntoView({ block: "start" });
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !("matchMedia" in window)) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function CampbellPortal() {
  const [active, setActive] = useState<Section>("events");
  const tabRailRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = TABS.findIndex((tab) => tab.id === active);
  const activeTab = TABS[activeIndex] ?? TABS[0];
  const activeImage = activeTab.image;

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
    const frame = window.requestAnimationFrame(scrollHashTargetIntoView);
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

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
      behavior: prefersReducedMotion() ? "auto" : "smooth",
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
              className={`cb-tab cb-accent-${tab.accent} ${active === tab.id ? "cb-tab--active" : ""}`}
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
                <span className="cb-tab-icon">
                  <tab.Icon size={18} strokeWidth={2.35} aria-hidden="true" />
                </span>
                <span className="cb-tab-eyebrow">{tab.eyebrow}</span>
              </span>
              <span className="cb-tab-label">{tab.label}</span>
              <span className="cb-tab-summary">{tab.summary}</span>
            </button>
          ))}
        </div>
      </section>

      <div
        className={`cb-content cb-accent-${activeTab.accent}`}
        id={panelId(activeTab.id)}
        role="tabpanel"
        aria-labelledby={tabId(activeTab.id)}
        tabIndex={-1}
      >
        <div className={`cb-panel-banner${activeImage ? "" : " cb-panel-banner--pattern"}`}>
          {activeImage && (
            <img
              src={activeImage.src}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ objectPosition: activeImage.objectPosition }}
            />
          )}
          <div className="cb-panel-banner-copy">
            <span>
              {activeTab.label} · {activeTab.eyebrow}
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
