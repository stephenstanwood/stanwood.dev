import { useState } from "react";
import eventFeed from "../../data/campbellEvents.json";
import councilFeed from "../../data/campbellCouncilRecords.json";
import hearingFeed from "../../data/campbellPublicHearings.json";
import {
  CAMPBELL_TIME_ZONE,
  COUNCIL_SOURCE_STALE_AFTER_DAYS,
  DAY_MS,
  endOfDay,
  parseCampbellDate,
  startOfDay,
} from "../../lib/campbell/dateHelpers";
import { eventInWindow, eventStart } from "../../lib/campbell/eventDates";
import { preferredCouncilRecord, type CampbellCouncilRecord } from "../../lib/campbell/types";

interface CampbellEvent {
  title: string;
  date: string;
  location: string;
  url: string;
  source?: string;
  startDate?: string;
  endDate?: string;
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
const COUNCIL_RECORDS = councilFeed.items as CampbellCouncilRecord[];
const PUBLIC_HEARINGS = hearingFeed.items as PublicHearing[];

function eventIsUpcoming(event: CampbellEvent, dayEnd: Date) {
  const start = eventStart(event);
  return Boolean(start && start.getTime() > dayEnd.getTime());
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPBELL_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function shortSummary(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 138);
}

export default function TodayInCampbell() {
  const [referenceDay] = useState(() => startOfDay(new Date()));

  const endOfReferenceDay = endOfDay(referenceDay);

  const todayEvents = EVENTS
    .filter((event) => eventInWindow(event, referenceDay, endOfReferenceDay))
    .slice(0, 4);
  const nextEvents = EVENTS
    .filter((event) => eventIsUpcoming(event, endOfReferenceDay))
    .sort((a, b) => (eventStart(a)?.getTime() ?? 0) - (eventStart(b)?.getTime() ?? 0))
    .slice(0, 3);

  const hearingsByDate = PUBLIC_HEARINGS
    .map((hearing) => ({ hearing, date: parseCampbellDate(hearing.hearingAt) }))
    .filter((item): item is { hearing: PublicHearing; date: Date } => Boolean(item.date))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const upcomingHearing = [...hearingsByDate]
    .reverse()
    .find((item) => item.date.getTime() >= referenceDay.getTime());
  const recentHearings = hearingsByDate.slice(0, 3);
  const latestCouncil = preferredCouncilRecord(COUNCIL_RECORDS);
  const latestCouncilDate = parseCampbellDate(latestCouncil?.date ?? "");
  const latestCouncilAgeDays = latestCouncilDate
    ? Math.floor((referenceDay.getTime() - startOfDay(latestCouncilDate).getTime()) / DAY_MS)
    : 0;
  const councilSourceLooksStale = latestCouncilAgeDays > COUNCIL_SOURCE_STALE_AFTER_DAYS;

  let cityHallFeature = <p>No dated public hearings found.</p>;
  if (upcomingHearing) {
    cityHallFeature = (
      <div className="cb-today-feature">
        <a href={upcomingHearing.hearing.noticeUrl || upcomingHearing.hearing.sourceUrl} target="_blank" rel="noopener noreferrer">
          {upcomingHearing.hearing.title}
        </a>
        <span>{formatDay(upcomingHearing.date)} - {upcomingHearing.hearing.body}</span>
      </div>
    );
  } else if (recentHearings.length > 0) {
    cityHallFeature = (
      <div className="cb-today-feature">
        <a href={recentHearings[0].hearing.noticeUrl || recentHearings[0].hearing.sourceUrl} target="_blank" rel="noopener noreferrer">
          Latest public notice
        </a>
        <span>{recentHearings[0].hearing.title}</span>
      </div>
    );
  }

  return (
    <section className="cb-today" aria-label="Today in Campbell">
      <div className="cb-today-head">
        <span>{formatDay(referenceDay)}</span>
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
            <p>No same-day events found.</p>
          )}
        </article>

        <article className="cb-today-card">
          <h3>City Hall watch</h3>
          {cityHallFeature}

          {latestCouncil && (
            <div className="cb-today-feature cb-today-feature--secondary">
              <a href={latestCouncil.agendaUrl} target="_blank" rel="noopener noreferrer">
                Newest listed council packet
              </a>
              <span>
                {councilSourceLooksStale
                  ? `City meeting portal currently lists ${latestCouncil.date} as newest`
                  : latestCouncil.date}
              </span>
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
            <p>No upcoming events found.</p>
          )}
        </article>
      </div>

      {recentHearings.length > 1 && (
        <div className="cb-today-notices">
          <span>Recent public notices</span>
          {recentHearings.slice(0, 3).map(({ hearing, date }) => (
            <a key={`${hearing.title}-${hearing.hearingAt}`} href={hearing.noticeUrl || hearing.sourceUrl} target="_blank" rel="noopener noreferrer">
              <span className="cb-notice-date">{formatDay(date)}</span>
              {" "}
              <span className="cb-notice-title">{shortSummary(hearing.title)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
