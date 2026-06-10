import { useMemo, useState } from "react";
import { CIVIC_SOURCES } from "../../data/campbell";
import councilFeed from "../../data/campbellCouncilRecords.json";
import hearingFeed from "../../data/campbellPublicHearings.json";
import {
  COUNCIL_SOURCE_STALE_AFTER_DAYS,
  DAY_MS,
  parseCampbellDate,
  startOfDay,
} from "../../lib/campbell/dateHelpers";
import SourceCardGrid from "./SourceCardGrid";

interface CouncilRecord {
  date: string;
  title: string;
  body: string;
  agendaUrl: string;
  minutesUrl?: string;
  mediaUrl?: string;
  meetingUrl?: string;
}

interface PublicHearing {
  id: string;
  body: string;
  title: string;
  hearingAt: string;
  summary: string;
  address?: string;
  fileNo?: string;
  planner?: string;
  sourceType: string;
  sourceUrl: string;
  noticeUrl?: string;
  extractionNote?: string;
}

type HearingFilter = "all" | "upcoming" | "recent" | "planning" | "council" | "needs-date";

const HEARING_FILTERS: { id: HearingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "recent", label: "Recent" },
  { id: "planning", label: "Planning" },
  { id: "council", label: "Council" },
  { id: "needs-date", label: "Needs date" },
];

const COUNCIL_RECORDS = (councilFeed.items as CouncilRecord[]).slice(0, 8);
const PUBLIC_HEARINGS = hearingFeed.items as PublicHearing[];

function plainSummary(summary: string) {
  const cleaned = summary.trim().replace(/\.$/, "");
  if (!cleaned) return "";

  if (/^(consider|receive comments|receive public comments)\b/i.test(cleaned)) {
    return `The hearing is to ${cleaned}.`;
  }
  if (/^(an|a|the|adoption|adopting|request|amending|approving)\b/i.test(cleaned)) {
    return `The hearing is about ${cleaned}.`;
  }

  return `${cleaned}.`;
}

function topicLabel(item: PublicHearing) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (/housing|residential|townhome|condominium|unit|subdivision|development/.test(text)) return "Housing and development";
  if (/fee|tax|budget|capital improvement|cip|charge/.test(text)) return "Fees, taxes, and budget";
  if (/beer|wine|entertainment|pharmacy|restaurant|bank|conditional use|use permit/.test(text)) return "Business and site use";
  if (/eir|environment|ceqa|building code|california building code/.test(text)) return "Environment and code";
  return "Public decision";
}

function impactLine(item: PublicHearing) {
  const topic = topicLabel(item);
  if (topic === "Housing and development") return "Why it matters: this could change what gets built, demolished, subdivided, or reviewed at the site.";
  if (topic === "Fees, taxes, and budget") return "Why it matters: this could change city fees, business taxes, capital projects, or what services cost.";
  if (topic === "Business and site use") return "Why it matters: this could change how a Campbell property operates, including allowed uses or customer-facing activity.";
  if (topic === "Environment and code") return "Why it matters: this could affect development review, environmental impacts, or construction rules.";
  return "Why it matters: a public body is taking comments or making a decision on this item.";
}

// A past hearing counts as "Recent" if it happened within the last six months.
function recentCutoff(today: Date) {
  const cutoff = new Date(today);
  cutoff.setMonth(cutoff.getMonth() - 6);
  return cutoff;
}

function hearingStatus(item: PublicHearing, today: Date) {
  const date = parseCampbellDate(item.hearingAt);
  if (!date) return "Date in packet";
  if (date >= today) return "Upcoming";
  return date >= recentCutoff(today) ? "Recent" : "Past";
}

function isRecentHearing(item: PublicHearing, today: Date) {
  const date = parseCampbellDate(item.hearingAt);
  if (!date || date >= today) return false;
  return date >= recentCutoff(today);
}

function hearingSummary(item: PublicHearing) {
  if (item.extractionNote) {
    return "Large official packet: open the notice for the complete date, plans, and project materials.";
  }
  return plainSummary(item.summary);
}

export default function CivicRecords() {
  const [activeFilter, setActiveFilter] = useState<HearingFilter>("all");
  const [today] = useState(() => startOfDay(new Date()));

  const filteredHearings = useMemo(() => {
    return PUBLIC_HEARINGS.filter((item) => {
      const date = parseCampbellDate(item.hearingAt);
      if (activeFilter === "upcoming") return date ? date >= today : false;
      if (activeFilter === "recent") return isRecentHearing(item, today);
      if (activeFilter === "planning") return item.body === "Planning Commission";
      if (activeFilter === "council") return item.body === "City Council";
      if (activeFilter === "needs-date") return !date;
      return true;
    });
  }, [activeFilter, today]);
  const upcomingCount = PUBLIC_HEARINGS.filter((item) => {
    const date = parseCampbellDate(item.hearingAt);
    return date ? date >= today : false;
  }).length;
  const recentCount = PUBLIC_HEARINGS.filter((item) => isRecentHearing(item, today)).length;
  const latestCouncilRecord = COUNCIL_RECORDS[0];
  const latestCouncilDate = parseCampbellDate(latestCouncilRecord?.date ?? "");
  const latestCouncilAgeDays = latestCouncilDate
    ? Math.floor((today.getTime() - latestCouncilDate.getTime()) / DAY_MS)
    : 0;
  const councilSourceLooksStale = latestCouncilAgeDays > COUNCIL_SOURCE_STALE_AFTER_DAYS;

  return (
    <div className="cb-records">
      <section className="cb-live-record-panel" aria-label="Campbell public hearings and notices">
        <div className="cb-live-record-head">
          <div>
            <span className="cb-live-record-kicker">Public hearings</span>
            <h4>What is coming through City Hall</h4>
            <p>
              {upcomingCount > 0
                ? `${upcomingCount} upcoming hearing${upcomingCount === 1 ? "" : "s"} on the calendar.`
                : `No upcoming hearings found. Showing ${recentCount} recent notice${recentCount === 1 ? "" : "s"} and packet items.`}
            </p>
          </div>
        </div>

        <div className="cb-hearing-filters" role="group" aria-label="Public hearing filters">
          {HEARING_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={activeFilter === filter.id ? "is-active" : ""}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="cb-hearing-list">
          {filteredHearings.map((item) => (
            <article className="cb-hearing-card" key={item.id}>
              <div className="cb-hearing-topline">
                <span>{item.body}</span>
                <em>{item.sourceType}</em>
              </div>
              <div className="cb-hearing-status-row">
                <span>{hearingStatus(item, today)}</span>
                <em>{topicLabel(item)}</em>
              </div>
              <h4>{item.title}</h4>
              <p className="cb-hearing-when">
                {item.hearingAt || "Date is in the official notice packet"}
              </p>
              <p className="cb-hearing-summary">{hearingSummary(item)}</p>
              <p className="cb-hearing-impact">{impactLine(item)}</p>
              {(item.address || item.fileNo || item.planner) && (
                <div className="cb-hearing-meta">
                  {item.address && <span>{item.address}</span>}
                  {item.fileNo && <span>{item.fileNo}</span>}
                  {item.planner && <span>{item.planner}</span>}
                </div>
              )}
              <div className="cb-record-links">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {item.sourceType === "Agenda item" ? "Agenda packet" : "Notice archive"}
                </a>
                {item.noticeUrl && (
                  <a href={item.noticeUrl} target="_blank" rel="noopener noreferrer">
                    Notice PDF
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {filteredHearings.length === 0 && (
          <p className="cb-hearing-empty">
            No records in this filter.
          </p>
        )}
      </section>

      <section className="cb-live-record-panel" aria-label="Campbell council agenda and minutes records">
        <div className="cb-live-record-head">
          <div>
            <span className="cb-live-record-kicker">Meeting portal</span>
            <h4>Council packets, minutes, and video</h4>
            <p>
              {councilSourceLooksStale && latestCouncilRecord
                ? `The city meeting portal currently lists ${latestCouncilRecord.date} as the newest council packet. Open the official source for anything posted after that.`
                : "Open the official agenda, minutes, or meeting video from the city's eScribe meeting portal."}
            </p>
          </div>
        </div>

        <div className="cb-council-record-list">
          {COUNCIL_RECORDS.map((record) => (
            <article className="cb-council-record" key={`${record.date}-${record.title}`}>
              <div>
                <span>{record.date}</span>
                <h4>{record.title}</h4>
              </div>
              <div className="cb-record-links">
                <a href={record.agendaUrl} target="_blank" rel="noopener noreferrer">
                  Agenda
                </a>
                {record.minutesUrl && (
                  <a href={record.minutesUrl} target="_blank" rel="noopener noreferrer">
                    Minutes
                  </a>
                )}
                {record.mediaUrl && (
                  <a href={record.mediaUrl} target="_blank" rel="noopener noreferrer">
                    Video
                  </a>
                )}
                {record.meetingUrl && (
                  <a href={record.meetingUrl} target="_blank" rel="noopener noreferrer">
                    Meeting page
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <SourceCardGrid sources={CIVIC_SOURCES} />
    </div>
  );
}
