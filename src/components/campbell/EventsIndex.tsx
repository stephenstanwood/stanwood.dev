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
}

interface EventSourceMeta {
  label: string;
  sourceUrl: string;
  count: number;
}

const feed = eventFeed as typeof eventFeed & { sources?: EventSourceMeta[] };
const EVENTS = (feed.items as CampbellEvent[]).slice(0, 14);
const SOURCE_COUNTS = feed.sources ?? [];
const generatedDate = new Date(eventFeed.generatedAt).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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

export default function EventsIndex() {
  return (
    <div className="cb-events">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Events</span>
        <h3>City and Downtown events are live.</h3>
        <p>
          This now merges the official City calendar with Downtown Campbell's
          event feed. Heritage Theatre listings, public meetings, community
          center dates, festivals, shop events, and farmers' market items land
          in one source-backed list.
        </p>
      </div>

      <div className="cb-live-events-head">
        <span>{eventFeed.items.length} synced Campbell events</span>
        <a href={eventFeed.sourceUrl} target="_blank" rel="noopener noreferrer">
          Synced {generatedDate}
        </a>
      </div>

      <div className="cb-event-source-counts" aria-label="Event source counts">
        {SOURCE_COUNTS.map((source) => (
          <a
            key={source.label}
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{source.count}</span>
            {source.label}
          </a>
        ))}
      </div>

      <div className="cb-live-events">
        {EVENTS.map((event) => (
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

      <div className="cb-anchor-grid">
        {EVENT_ANCHORS.map((anchor) => (
          <article key={anchor.label} className="cb-anchor-card">
            <span>{anchor.label}</span>
            <p>{anchor.items}</p>
          </article>
        ))}
      </div>

      <SourceCardGrid sources={EVENT_SOURCES} />
    </div>
  );
}
