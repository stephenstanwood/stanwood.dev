import eventFeed from "../../data/campbellEvents.json";
import councilFeed from "../../data/campbellCouncilRecords.json";
import hearingFeed from "../../data/campbellPublicHearings.json";

interface CampbellEvent {
  title: string;
  date: string;
  location: string;
  url: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}

interface CouncilRecord {
  date: string;
  title: string;
  agendaUrl: string;
  minutesUrl?: string;
  mediaUrl?: string;
}

interface PublicHearing {
  title: string;
  body: string;
  hearingAt: string;
  summary: string;
  sourceType: string;
  sourceUrl: string;
  noticeUrl?: string;
}

const EVENTS = eventFeed.items as CampbellEvent[];
const COUNCIL_RECORDS = councilFeed.items as CouncilRecord[];
const PUBLIC_HEARINGS = hearingFeed.items as PublicHearing[];

function parseDate(value = "") {
  if (!value) return null;
  const normalized = value
    .replace(/\bat\b/i, "")
    .replace(/a\.m\./gi, "AM")
    .replace(/p\.m\./gi, "PM");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function eventStart(event: CampbellEvent) {
  return parseDate(event.startDate ?? "");
}

function eventEnd(event: CampbellEvent) {
  return parseDate(event.endDate ?? "") ?? eventStart(event);
}

function eventHappensToday(event: CampbellEvent, startOfDay: Date, endOfDay: Date) {
  const start = eventStart(event);
  const end = eventEnd(event);
  if (!start || !end) return false;
  return start.getTime() <= endOfDay.getTime() && end.getTime() >= startOfDay.getTime();
}

function eventIsUpcoming(event: CampbellEvent, endOfDay: Date) {
  const start = eventStart(event);
  return Boolean(start && start.getTime() > endOfDay.getTime());
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function shortSummary(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 138);
}

export default function TodayInCampbell() {
  const sourceDate = new Date(eventFeed.generatedAt);
  const startOfDay = new Date(sourceDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const todayEvents = EVENTS
    .filter((event) => eventHappensToday(event, startOfDay, endOfDay))
    .slice(0, 4);
  const nextEvents = EVENTS
    .filter((event) => eventIsUpcoming(event, endOfDay))
    .sort((a, b) => (eventStart(a)?.getTime() ?? 0) - (eventStart(b)?.getTime() ?? 0))
    .slice(0, 3);

  const hearingsByDate = PUBLIC_HEARINGS
    .map((hearing) => ({ hearing, date: parseDate(hearing.hearingAt) }))
    .filter((item): item is { hearing: PublicHearing; date: Date } => Boolean(item.date))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const upcomingHearing = [...hearingsByDate]
    .reverse()
    .find((item) => item.date.getTime() >= startOfDay.getTime());
  const recentHearings = hearingsByDate.slice(0, 3);
  const latestCouncil = COUNCIL_RECORDS[0];

  return (
    <section className="cb-today" aria-label="Today in Campbell">
      <div className="cb-today-head">
        <span>{formatDay(startOfDay)}</span>
        <h2>Today in Campbell</h2>
        <p>Events, public notices, and the next city record worth opening.</p>
      </div>

      <div className="cb-today-grid">
        <article className="cb-today-card">
          <h3>Happening today</h3>
          {todayEvents.length > 0 ? (
            <ul>
              {todayEvents.map((event) => (
                <li key={`${event.title}-${event.date}`}>
                  <a href={event.url} target="_blank" rel="noopener noreferrer">
                    {event.title}
                  </a>
                  <span>{event.location || event.source || event.date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No same-day events in the current feed.</p>
          )}
        </article>

        <article className="cb-today-card">
          <h3>City Hall watch</h3>
          {upcomingHearing ? (
            <div className="cb-today-feature">
              <a href={upcomingHearing.hearing.noticeUrl || upcomingHearing.hearing.sourceUrl} target="_blank" rel="noopener noreferrer">
                {upcomingHearing.hearing.title}
              </a>
              <span>{formatDay(upcomingHearing.date)} - {upcomingHearing.hearing.body}</span>
            </div>
          ) : recentHearings.length > 0 ? (
            <div className="cb-today-feature">
              <a href={recentHearings[0].hearing.noticeUrl || recentHearings[0].hearing.sourceUrl} target="_blank" rel="noopener noreferrer">
                Latest public notice
              </a>
              <span>{recentHearings[0].hearing.title}</span>
            </div>
          ) : (
            <p>No dated public hearings in the current feed.</p>
          )}

          {latestCouncil && (
            <div className="cb-today-feature cb-today-feature--secondary">
              <a href={latestCouncil.agendaUrl} target="_blank" rel="noopener noreferrer">
                Latest council packet
              </a>
              <span>{latestCouncil.date}</span>
            </div>
          )}
        </article>

        <article className="cb-today-card">
          <h3>Next up</h3>
          {nextEvents.length > 0 ? (
            <ul>
              {nextEvents.map((event) => {
                const start = eventStart(event);
                return (
                  <li key={`${event.title}-${event.date}`}>
                    <a href={event.url} target="_blank" rel="noopener noreferrer">
                      {event.title}
                    </a>
                    <span>{start ? formatDay(start) : event.date}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No upcoming events in the current feed.</p>
          )}
        </article>
      </div>

      {recentHearings.length > 1 && (
        <div className="cb-today-notices">
          <span>Recent public notices</span>
          {recentHearings.slice(0, 3).map(({ hearing, date }) => (
            <a key={`${hearing.title}-${hearing.hearingAt}`} href={hearing.noticeUrl || hearing.sourceUrl} target="_blank" rel="noopener noreferrer">
              {formatDay(date)}: {shortSummary(hearing.title)}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
