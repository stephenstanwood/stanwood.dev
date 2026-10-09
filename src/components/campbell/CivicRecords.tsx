import { useMemo, useState } from "react";
import { CIVIC_SOURCES } from "../../data/campbell";
import councilFeed from "../../data/campbellCouncilRecords.json";
import hearingFeed from "../../data/campbellPublicHearings.json";
import {
  councilSourceLooksStale,
  parseCampbellDate,
  startOfDay,
} from "../../lib/campbell/dateHelpers";
import { preferredCouncilRecord, type CampbellCouncilRecord } from "../../lib/campbell/types";
import FilterButtons from "./FilterButtons";
import SourceCardGrid from "./SourceCardGrid";
import { pluralize } from "../../lib/text";

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
  agendaUrl?: string;
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

const COUNCIL_RECORDS = (councilFeed.items as CampbellCouncilRecord[]).slice(0, 8);
const PUBLIC_HEARINGS = hearingFeed.items as PublicHearing[];
const HEARING_DISPLAY_LIMIT = 6;

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

// First matching pattern wins; the fallback topic sits at the end of the list.
const HEARING_TOPICS: { pattern: RegExp; label: string }[] = [
  {
    pattern: /housing|residential|townhome|condominium|unit|subdivision|development/,
    label: "Housing and development",
  },
  {
    pattern: /fee|tax|budget|capital improvement|cip|charge/,
    label: "Fees, taxes, and budget",
  },
  {
    pattern: /beer|wine|entertainment|pharmacy|restaurant|bank|conditional use|use permit/,
    label: "Business and site use",
  },
  {
    pattern: /eir|environment|ceqa|building code|california building code/,
    label: "Environment and code",
  },
  {
    pattern: /.*/,
    label: "Public decision",
  },
];

function hearingTopic(item: PublicHearing) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return HEARING_TOPICS.find((topic) => topic.pattern.test(text)) ?? HEARING_TOPICS[HEARING_TOPICS.length - 1];
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

function isUpcomingHearing(item: PublicHearing, today: Date) {
  return hearingStatus(item, today) === "Upcoming";
}

function isRecentHearing(item: PublicHearing, today: Date) {
  return hearingStatus(item, today) === "Recent";
}

// Records merged from a notice archive keep the notice as `sourceUrl` and carry
// the packet separately, so only those need a second "Agenda packet" link.
function isAgendaSourced(item: PublicHearing) {
  return item.sourceType === "Agenda item";
}

function hearingSummary(item: PublicHearing) {
  if (item.extractionNote) {
    return "Large official packet: open the notice for the complete date, plans, and project materials.";
  }
  return plainSummary(item.summary);
}

export default function CivicRecords() {
  const [activeFilter, setActiveFilter] = useState<HearingFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [today] = useState(() => startOfDay(new Date()));

  const filteredHearings = useMemo(() => {
    return PUBLIC_HEARINGS.filter((item) => {
      if (activeFilter === "upcoming") return isUpcomingHearing(item, today);
      if (activeFilter === "recent") return isRecentHearing(item, today);
      if (activeFilter === "planning") return item.body === "Planning Commission";
      if (activeFilter === "council") return item.body === "City Council";
      if (activeFilter === "needs-date") return !parseCampbellDate(item.hearingAt);
      return true;
    });
  }, [activeFilter, today]);
  const visibleHearings = showAll ? filteredHearings : filteredHearings.slice(0, HEARING_DISPLAY_LIMIT);
  const hiddenHearingCount = filteredHearings.length - visibleHearings.length;
  const upcomingCount = PUBLIC_HEARINGS.filter((item) => isUpcomingHearing(item, today)).length;
  const recentCount = PUBLIC_HEARINGS.filter((item) => isRecentHearing(item, today)).length;
  const latestCouncilRecord = preferredCouncilRecord(COUNCIL_RECORDS);
  const latestCouncilIsStale = councilSourceLooksStale(latestCouncilRecord, today);

  return (
    <div className="cb-records">
      <section className="cb-live-record-panel" aria-label="Campbell public hearings and notices">
        <div className="cb-live-record-head">
          <div>
            <span className="cb-live-record-kicker">Public hearings</span>
            <h4>What is coming through City Hall</h4>
            <p>
              {upcomingCount > 0
                ? `${upcomingCount} upcoming ${pluralize(upcomingCount, "hearing")} on the calendar.`
                : `No upcoming hearings found. Showing ${recentCount} recent ${pluralize(recentCount, "notice")} and packet items.`}
            </p>
          </div>
        </div>

        <FilterButtons
          className="cb-hearing-filters"
          ariaLabel="Public hearing filters"
          options={HEARING_FILTERS}
          active={activeFilter}
          onSelect={(filter) => {
            setActiveFilter(filter);
            setShowAll(false);
          }}
        />

        <div className="cb-hearing-list">
          {visibleHearings.map((item) => (
            <article className="cb-hearing-card" key={item.id}>
              <div className="cb-hearing-topline">
                <span>{item.body}</span>
                <em>{item.sourceType}</em>
              </div>
              <div className="cb-hearing-status-row">
                <span>{hearingStatus(item, today)}</span>
                <em>{hearingTopic(item).label}</em>
              </div>
              <h4>{item.title}</h4>
              <p className="cb-hearing-when">
                {item.hearingAt || "Date is in the official notice packet"}
              </p>
              <p className="cb-hearing-summary">{hearingSummary(item)}</p>
              {(item.address || item.fileNo || item.planner) && (
                <div className="cb-hearing-meta">
                  {item.address && <span>{item.address}</span>}
                  {item.fileNo && <span>{item.fileNo}</span>}
                  {item.planner && <span>{item.planner}</span>}
                </div>
              )}
              <div className="cb-record-links">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {isAgendaSourced(item) ? "Agenda packet" : "Notice archive"}
                </a>
                {!isAgendaSourced(item) && item.agendaUrl && (
                  <a href={item.agendaUrl} target="_blank" rel="noopener noreferrer">
                    Agenda packet
                  </a>
                )}
                {item.noticeUrl && (
                  <a href={item.noticeUrl} target="_blank" rel="noopener noreferrer">
                    Notice PDF
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {hiddenHearingCount > 0 && (
          <button type="button" className="cb-hearing-more cb-business-more" onClick={() => setShowAll(true)}>
            Show {hiddenHearingCount} more hearings
          </button>
        )}

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
              {latestCouncilIsStale && latestCouncilRecord
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
