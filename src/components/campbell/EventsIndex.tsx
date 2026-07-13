import { useEffect, useMemo, useState } from "react";
import { EVENT_SOURCES } from "../../data/campbell";
import eventFeed from "../../data/campbellEvents.json";
import { addCampbellDays, endOfDay, startOfDay } from "../../lib/campbell/dateHelpers";
import {
  campbellWeekendWindow,
  eventDateLabel,
  eventInWindow,
  eventStart,
} from "../../lib/campbell/eventDates";
import GhostInput from "./GhostInput";
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
const ALL_SOURCE_FILTER = "all";
const ALL_CATEGORY_FILTER = "all";
const EVENT_DISPLAY_LIMIT = 18;
type EventViewFilter = "today" | "weekend" | "all" | "next14" | "next30" | "public";
const HASH_VIEW_FILTERS: Record<string, EventViewFilter> = {
  "#campbell-events-next14": "next14",
  "#campbell-events-weekend": "weekend",
};

const VIEW_FILTERS: { id: EventViewFilter; label: string }[] = [
  { id: "next14", label: "Next 14 days" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "next30", label: "Next 30 days" },
  { id: "all", label: "All dates" },
  { id: "public", label: "Public meetings" },
];

type EventShortcut = {
  label: string;
  query?: string;
  source?: string;
  view?: EventViewFilter;
};

const EVENT_SHORTCUTS: EventShortcut[] = [
  { label: "This weekend", view: "weekend" },
  { label: "City Hall", source: "City of Campbell Calendar", view: "public" },
  { label: "Library", source: "Campbell Library Events", view: "next30" },
  { label: "Farmers' market", query: "Farmers' Market", view: "next30" },
  { label: "Heritage Theatre", source: "Campbell Heritage Theatre Events", view: "next30" },
  { label: "Free", query: "Free", view: "next30" },
];

const SOURCE_FILTERS = [
  { id: ALL_SOURCE_FILTER, label: "Every calendar" },
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

const EVENT_TITLES = Array.from(new Set(EVENTS.map((event) => event.title)));

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
    items: "Block events, school-board dates, Chamber events, and recurring group meetups.",
  },
];

function eventSourceFilterLabel(label: string) {
  if (label === "City of Campbell Calendar") return "City calendar";
  if (label === "Downtown Campbell Events") return "Downtown";
  if (label === "Campbell Library Events") return "Library";
  if (label === "Campbell Chamber Events") return "Chamber";
  if (label === "Campbell Museums Events") return "Museums";
  if (label === "Campbell Heritage Theatre Events") return "Heritage Theatre";
  if (label === "Campbell Union School District Events") return "Schools";
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

function eventMatchesView(event: CampbellEvent, viewFilter: EventViewFilter, referenceDay: Date) {
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

  const startOfReferenceDay = startOfDay(referenceDay);

  if (viewFilter === "today") {
    return eventInWindow(event, startOfReferenceDay, endOfDay(startOfReferenceDay));
  }

  if (viewFilter === "weekend") {
    const weekend = campbellWeekendWindow(startOfReferenceDay);
    return eventInWindow(event, weekend.start, weekend.end);
  }

  const windowDays = viewFilter === "next14" ? 14 : 30;
  const windowEnd = endOfDay(addCampbellDays(startOfReferenceDay, windowDays));
  return eventInWindow(event, startOfReferenceDay, windowEnd);
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

function viewFilterFromHash(hash: string) {
  return HASH_VIEW_FILTERS[hash.toLowerCase()] ?? null;
}

// Anchor the tile to Campbell's timezone so server and client render the
// same day number regardless of where the HTML is generated.
function eventDateTile(event: CampbellEvent) {
  const start = eventStart(event);
  if (!start) return null;
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", ...options }).format(start);
  return { day: part({ day: "numeric" }), month: part({ month: "short" }), weekday: part({ weekday: "short" }) };
}

function eventResultLabel(
  count: number,
  total: number,
  viewFilter: EventViewFilter,
  sourceFilter: string,
  categoryFilter: string,
  query: string,
) {
  const hasExtraFilter =
    sourceFilter !== ALL_SOURCE_FILTER ||
    categoryFilter !== ALL_CATEGORY_FILTER ||
    query.trim().length > 0;
  const noun = count === 1 ? "event" : "events";

  if (viewFilter === "all" && !hasExtraFilter && count === total) return "All events";
  if (hasExtraFilter) return `${count} ${noun}`;
  if (viewFilter === "today") return count === 0 ? "No events today" : `${count} today`;
  if (viewFilter === "weekend") return count === 0 ? "No events this weekend" : `${count} this weekend`;
  if (viewFilter === "next14") return `${count} in next 14 days`;
  if (viewFilter === "next30") return `${count} in next 30 days`;
  if (viewFilter === "public") return `${count} public ${noun}`;
  return `${count} ${noun}`;
}

function viewFilterLabel(viewFilter: EventViewFilter) {
  if (viewFilter === "today") return "today";
  if (viewFilter === "weekend") return "this weekend";
  if (viewFilter === "next14") return "the next 14 days";
  if (viewFilter === "next30") return "the next 30 days";
  if (viewFilter === "public") return "public meetings";
  return "all listed dates";
}

function eventContextLabel(viewFilter: EventViewFilter, sourceFilter: string, categoryFilter: string, query: string) {
  const sourceText = sourceFilter !== ALL_SOURCE_FILTER
    ? `from ${eventSourceFilterLabel(sourceFilter)}`
    : "from Campbell calendars";
  const filters: string[] = [];

  if (categoryFilter !== ALL_CATEGORY_FILTER) {
    filters.push(`tagged ${categoryFilter}`);
  }

  const searchText = query.trim();
  if (searchText) {
    filters.push(`matching "${searchText}"`);
  }

  return `Showing ${viewFilterLabel(viewFilter)} ${sourceText}${filters.length ? `, ${filters.join(", ")}` : ""}.`;
}

export default function EventsIndex() {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState(ALL_SOURCE_FILTER);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY_FILTER);
  const [viewFilter, setViewFilter] = useState<EventViewFilter>("next14");
  const [showAll, setShowAll] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(() => new Set());
  const [referenceDay] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    function syncViewFromHash() {
      const nextViewFilter = viewFilterFromHash(window.location.hash);
      if (!nextViewFilter) return;
      setViewFilter(nextViewFilter);
      setShowAll(false);
    }

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      if (!eventMatchesSource(event, sourceFilter)) return false;
      if (categoryFilter !== ALL_CATEGORY_FILTER && event.category !== categoryFilter) return false;
      if (!eventMatchesView(event, viewFilter, referenceDay)) return false;
      return eventMatchesQuery(event, query);
    });
  }, [categoryFilter, query, referenceDay, sourceFilter, viewFilter]);

  const visibleEvents = showAll ? filteredEvents : filteredEvents.slice(0, EVENT_DISPLAY_LIMIT);
  const hiddenEventCount = filteredEvents.length - visibleEvents.length;
  const resultLabel = eventResultLabel(
    filteredEvents.length,
    EVENTS.length,
    viewFilter,
    sourceFilter,
    categoryFilter,
    query,
  );
  const contextLabel = eventContextLabel(viewFilter, sourceFilter, categoryFilter, query);
  const filtersAreActive =
    query.trim().length > 0 ||
    sourceFilter !== ALL_SOURCE_FILTER ||
    categoryFilter !== ALL_CATEGORY_FILTER ||
    viewFilter !== "next14";

  function clearFilters() {
    setQuery("");
    setSourceFilter(ALL_SOURCE_FILTER);
    setCategoryFilter(ALL_CATEGORY_FILTER);
    setViewFilter("next14");
    setShowAll(false);
  }

  function applyShortcut(shortcut: EventShortcut) {
    setQuery(shortcut.query ?? "");
    setSourceFilter(shortcut.source ?? ALL_SOURCE_FILTER);
    setCategoryFilter(ALL_CATEGORY_FILTER);
    setViewFilter(shortcut.view ?? "next14");
    setShowAll(false);
  }

  function shortcutIsActive(shortcut: EventShortcut) {
    return (
      query === (shortcut.query ?? "") &&
      sourceFilter === (shortcut.source ?? ALL_SOURCE_FILTER) &&
      categoryFilter === ALL_CATEGORY_FILTER &&
      viewFilter === (shortcut.view ?? "next14")
    );
  }

  return (
    <div className="cb-events" id="campbell-events-next14">
      <div className="cb-events-intro">
        <span>Upcoming Events</span>
        <h3>What is happening next in Campbell.</h3>
        <p>
          Search city, downtown, library, theater, school, and Chamber calendars.
          City Hall keeps meetings and hearings easy to find.
        </p>
      </div>

      <div className="cb-event-toolbar">
        <GhostInput
          className="cb-event-search"
          placeholder="Search events, places, costs, or topics"
          ariaLabel="Search events"
          value={query}
          candidates={EVENT_TITLES}
          onValueChange={(value) => {
            setQuery(value);
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
        {filtersAreActive && (
          <button type="button" className="cb-filter-reset" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <div className="cb-event-shortcuts" aria-label="Resident event shortcuts">
        {EVENT_SHORTCUTS.map((shortcut) => {
          const isActive = shortcutIsActive(shortcut);

          return (
            <button
              key={shortcut.label}
              type="button"
              className={isActive ? "is-active" : ""}
              onClick={() => applyShortcut(shortcut)}
              aria-pressed={isActive}
            >
              {shortcut.label}
            </button>
          );
        })}
      </div>

      <div className="cb-event-filter-group" aria-label="Event calendar filters">
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

      <p className="cb-event-context" aria-live="polite">
        {contextLabel}
      </p>

      <div className="cb-live-events">
        {visibleEvents.map((event) => {
          const imageUrl = event.imageUrl.trim();
          const showImage = imageUrl.length > 0 && !failedImageUrls.has(imageUrl);
          const tile = showImage ? null : eventDateTile(event);
          return (
            <a
              key={`${event.date}-${event.title}`}
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`cb-event-card${showImage ? "" : " cb-event-card--text"}`}
            >
              {showImage ? (
                <img
                  src={imageUrl}
                  alt=""
                  loading="lazy"
                  onError={() => {
                    setFailedImageUrls((current) => {
                      if (current.has(imageUrl)) return current;
                      const next = new Set(current);
                      next.add(imageUrl);
                      return next;
                    });
                  }}
                />
              ) : (
                <span className="cb-event-tile" aria-hidden="true">
                  {tile ? (
                    <>
                      <i>{tile.weekday}</i>
                      <b>{tile.day}</b>
                      <i>{tile.month}</i>
                    </>
                  ) : (
                    <b className="cb-event-tile-tba">TBA</b>
                  )}
                </span>
              )}
              <div className="cb-event-card-body">
                <div className="cb-event-meta">
                  <span className="cb-event-date">{eventDateLabel(event)}</span>
                  {(event.category || event.source) && (
                    <span className="cb-event-source">
                      {event.category || event.source}
                    </span>
                  )}
                </div>
                <h4>{event.title}</h4>
                <p>{event.location || "Campbell"}{event.cost ? ` · ${event.cost}` : ""}</p>
                {event.description && <p className="cb-event-desc">{event.description}</p>}
                <span className="cb-event-open">Open listing</span>
              </div>
            </a>
          );
        })}
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
        <span className="cb-section-kicker">Check details</span>
        <h3>Confirm an event before you go.</h3>
        <p>
          Each card opens the original calendar or listing. Public meetings stay
          visible here; closures, no-school days, and team-only notices stay out
          of the guide.
        </p>
      </div>

      <SourceCardGrid sources={EVENT_SOURCES} />
    </div>
  );
}
