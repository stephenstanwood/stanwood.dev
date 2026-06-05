import { useMemo, useState } from "react";
import { EVENT_SOURCES } from "../../data/campbell";
import eventFeed from "../../data/campbellEvents.json";
import SourceCardGrid from "./SourceCardGrid";

interface CampbellEvent {
  title: string;
  date: string;
  cost: string;
  location: string;
  description: string;
  url: string;
  imageUrl: string;
  category?: string;
  source?: string;
  sourceUrl?: string;
  startDate?: string;
  endDate?: string;
  additionalSourceUrls?: string[];
  topics?: string[];
}

interface EventSourceMeta {
  label: string;
  sourceUrl: string;
  count: number;
}

const feed = eventFeed as typeof eventFeed & { sources?: EventSourceMeta[] };
const EVENTS = feed.items as CampbellEvent[];
const SOURCE_COUNTS = feed.sources ?? [];
const SYNC_DATE = new Date(eventFeed.generatedAt);
const DAY_MS = 24 * 60 * 60 * 1000;
const ALL_SOURCE_FILTER = "all";
const ALL_CATEGORY_FILTER = "all";
const EVENT_DISPLAY_LIMIT = 36;
type EventViewFilter = "all" | "next14" | "next30" | "public";

const VIEW_FILTERS: { id: EventViewFilter; label: string }[] = [
  { id: "all", label: "All dates" },
  { id: "next14", label: "Next 14 days" },
  { id: "next30", label: "Next 30 days" },
  { id: "public", label: "Public meetings" },
];

const SOURCE_FILTERS = [
  { id: ALL_SOURCE_FILTER, label: "All sources" },
  ...SOURCE_COUNTS.map((source) => ({
    id: source.label,
    label: eventSourceFilterLabel(source.label),
  })),
];

const CATEGORY_OPTIONS = [
  ALL_CATEGORY_FILTER,
  ...Array.from(new Set(EVENTS.map((event) => event.category).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b),
  ),
];

const EVENT_ANCHORS = [
  {
    label: "Downtown",
    items: "Farmers' market, festivals, shop events, nightlife, and seasonal walks.",
  },
  {
    label: "City",
    items: "Council meetings, recreation, community center, parks, pool, and public meetings.",
  },
  {
    label: "Culture",
    items: "Heritage Theatre, Ainsley House, museum programs, library events, and school performances.",
  },
  {
    label: "Neighborhoods",
    items: "Block events, school calendars, chamber events, and recurring group meetups.",
  },
];

function parseEventStart(event: CampbellEvent) {
  if (!event.startDate) return null;
  const date = new Date(event.startDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function eventSourceFilterLabel(label: string) {
  if (label === "City of Campbell Calendar") return "City calendar";
  if (label === "Downtown Campbell Events") return "Downtown";
  if (label === "Campbell Library Events") return "Library";
  if (label === "Campbell Chamber Events") return "Chamber";
  if (label === "Campbell Museums Events") return "Museums";
  if (label === "Campbell Heritage Theatre Events") return "Heritage Theatre";
  return label;
}

function eventMatchesSource(event: CampbellEvent, sourceFilter: string) {
  if (sourceFilter === ALL_SOURCE_FILTER) return true;
  const sourceText = [
    event.source ?? "",
    event.sourceUrl ?? "",
    ...(event.additionalSourceUrls ?? []),
  ].join(" ");
  return sourceText.includes(sourceFilter);
}

function eventMatchesView(event: CampbellEvent, viewFilter: EventViewFilter) {
  if (viewFilter === "all") return true;

  const text = [
    event.title,
    event.category ?? "",
    event.source ?? "",
    event.description,
  ].join(" ");

  if (viewFilter === "public") {
    return /council|commission|committee|board|meeting|hearing/i.test(text);
  }

  const start = parseEventStart(event);
  if (!start) return false;
  const startOfSyncDay = new Date(SYNC_DATE);
  startOfSyncDay.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((start.getTime() - startOfSyncDay.getTime()) / DAY_MS);
  if (viewFilter === "next14") return diffDays >= -1 && diffDays <= 14;
  if (viewFilter === "next30") return diffDays >= -1 && diffDays <= 30;
  return true;
}

function eventMatchesQuery(event: CampbellEvent, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    event.title,
    event.date,
    event.location,
    event.cost,
    event.description,
    event.category ?? "",
    event.source ?? "",
    ...(event.topics ?? []),
  ].some((value) => value.toLowerCase().includes(needle));
}

export default function EventsIndex() {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState(ALL_SOURCE_FILTER);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY_FILTER);
  const [viewFilter, setViewFilter] = useState<EventViewFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      if (!eventMatchesSource(event, sourceFilter)) return false;
      if (categoryFilter !== ALL_CATEGORY_FILTER && event.category !== categoryFilter) return false;
      if (!eventMatchesView(event, viewFilter)) return false;
      return eventMatchesQuery(event, query);
    });
  }, [categoryFilter, query, sourceFilter, viewFilter]);

  const visibleEvents = showAll ? filteredEvents : filteredEvents.slice(0, EVENT_DISPLAY_LIMIT);
  const hiddenEventCount = filteredEvents.length - visibleEvents.length;
  const resultLabel = filteredEvents.length === EVENTS.length ? "All events" : `${filteredEvents.length} matches`;

  return (
    <div className="cb-events">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Events</span>
        <h3>Campbell events, in plain view.</h3>
        <p>
          City meetings, downtown happenings, library programs, museum days,
          theatre shows, and Chamber events. Search by place, cost, topic, or
          source, then open the original listing for details.
        </p>
      </div>

      <div className="cb-event-toolbar">
        <input
          type="text"
          className="cb-event-search"
          placeholder="Search events, places, costs, or sources"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShowAll(false);
          }}
        />
        <select
          className="cb-event-select"
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setShowAll(false);
          }}
          aria-label="Event topic"
        >
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category === ALL_CATEGORY_FILTER ? "All topics" : category}
            </option>
          ))}
        </select>
        <span className="cb-event-count">{resultLabel}</span>
      </div>

      <div className="cb-event-filter-group" aria-label="Event source filters">
        {SOURCE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={sourceFilter === filter.id ? "is-active" : ""}
            onClick={() => {
              setSourceFilter(filter.id);
              setShowAll(false);
            }}
            aria-pressed={sourceFilter === filter.id}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="cb-event-filter-group" aria-label="Event date filters">
        {VIEW_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={viewFilter === filter.id ? "is-active" : ""}
            onClick={() => {
              setViewFilter(filter.id);
              setShowAll(false);
            }}
            aria-pressed={viewFilter === filter.id}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="cb-live-events">
        {visibleEvents.map((event) => (
          <a
            key={`${event.date}-${event.title}`}
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`cb-event-card${event.imageUrl ? "" : " cb-event-card--text"}`}
          >
            {event.imageUrl && (
              <img src={event.imageUrl} alt="" loading="lazy" />
            )}
            <div className="cb-event-card-body">
              <div className="cb-event-meta">
                <span className="cb-event-date">{event.date || "Date TBA"}</span>
                {(event.category || event.source) && (
                  <span className="cb-event-source">
                    {event.category || event.source}
                  </span>
                )}
              </div>
              <h4>{event.title}</h4>
              <p>{event.location || "Campbell"}{event.cost ? ` · ${event.cost}` : ""}</p>
              {event.description && <p className="cb-event-desc">{event.description}</p>}
            </div>
          </a>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="cb-event-empty">
          No events match these filters yet. Clear a filter or search another term.
        </div>
      )}

      {hiddenEventCount > 0 && (
        <button
          type="button"
          className="cb-event-more"
          onClick={() => setShowAll(true)}
        >
          Show {hiddenEventCount} more events
        </button>
      )}

      <div className="cb-anchor-grid">
        {EVENT_ANCHORS.map((anchor) => (
          <article key={anchor.label} className="cb-anchor-card">
            <span>{anchor.label}</span>
            <p>{anchor.items}</p>
          </article>
        ))}
      </div>

      <div className="cb-section-head cb-event-source-head">
        <span className="cb-section-kicker">Source Map</span>
        <h3>Where each listing comes from.</h3>
        <p>
          The list pulls from city, downtown, library, museum, theatre, and
          Chamber pages. The next direct calendars are schools, parks,
          shopping centers, and high-signal individual businesses.
        </p>
      </div>

      <SourceCardGrid sources={EVENT_SOURCES} />
    </div>
  );
}
