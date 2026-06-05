import { useMemo, useState } from "react";
import { CIVIC_SOURCES, SOURCE_URLS } from "../../data/campbell";
import councilFeed from "../../data/campbellCouncilRecords.json";
import hearingFeed from "../../data/campbellPublicHearings.json";
import SourceCardGrid from "./SourceCardGrid";

interface CouncilRecord {
  date: string;
  title: string;
  body: string;
  agendaUrl: string;
  minutesUrl?: string;
  mediaUrl?: string;
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

const RECORDS_QUEUE = [
  "Full-text agenda packet extraction",
  "Plain-English summaries for every public hearing",
  "Planning Commission and Historic Preservation Board vote outcomes",
  "Budget, fee schedule, and capital projects",
  "Public notices and city contracts",
  "Zoning, parcels, and map layers",
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

function parseHearingDate(value: string) {
  if (!value) return null;
  const normalized = value
    .replace(/\bat\b/i, "")
    .replace(/a\.m\./gi, "AM")
    .replace(/p\.m\./gi, "PM");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function hearingStatus(item: PublicHearing, today: Date) {
  const date = parseHearingDate(item.hearingAt);
  if (!date) return "Date in packet";
  if (date >= today) return "Upcoming";

  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return date >= sixMonthsAgo ? "Recent" : "Past";
}

function isRecentHearing(item: PublicHearing, today: Date) {
  const date = parseHearingDate(item.hearingAt);
  if (!date || date >= today) return false;
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return date >= sixMonthsAgo;
}

export default function CivicRecords() {
  const [activeFilter, setActiveFilter] = useState<HearingFilter>("all");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredHearings = useMemo(() => {
    return PUBLIC_HEARINGS.filter((item) => {
      const date = parseHearingDate(item.hearingAt);
      if (activeFilter === "upcoming") return date ? date >= today : false;
      if (activeFilter === "recent") return isRecentHearing(item, today);
      if (activeFilter === "planning") return item.body === "Planning Commission";
      if (activeFilter === "council") return item.body === "City Council";
      if (activeFilter === "needs-date") return !date;
      return true;
    });
  }, [activeFilter, today]);
  const upcomingCount = PUBLIC_HEARINGS.filter((item) => {
    const date = parseHearingDate(item.hearingAt);
    return date ? date >= today : false;
  }).length;
  const recentCount = PUBLIC_HEARINGS.filter((item) => isRecentHearing(item, today)).length;

  return (
    <div className="cb-records">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Civic records</span>
        <h3>Every decision should be findable and readable.</h3>
        <p>
          The city already publishes the raw material. This page is turning it into
          a local record: what is happening, when it happens, where the official
          packet lives, and what address or topic it affects.
        </p>
      </div>

      <section className="cb-live-record-panel" aria-label="Campbell public hearings and notices">
        <div className="cb-live-record-head">
          <div>
            <span className="cb-live-record-kicker">Public hearings</span>
            <h4>What is coming through City Hall</h4>
            <p>
              {upcomingCount > 0
                ? `${upcomingCount} future-dated hearing${upcomingCount === 1 ? "" : "s"} in the current feed.`
                : `No future-dated hearings in the current feed. Showing ${recentCount} recent notice${recentCount === 1 ? "" : "s"} and packet items.`}
            </p>
          </div>
        </div>

        <div className="cb-hearing-filters" role="tablist" aria-label="Public hearing filters">
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
              <p className="cb-hearing-summary">
                {item.extractionNote ? "Large official packet: open the notice for the complete date, plans, and project materials." : plainSummary(item.summary)}
              </p>
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
            <span className="cb-live-record-kicker">Agenda Center</span>
            <h4>Council packets, minutes, and media</h4>
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
                    Media
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <SourceCardGrid sources={CIVIC_SOURCES} />

      <div className="cb-next-panel">
        <div>
          <span className="cb-next-label">Build queue</span>
          <h4>Next civic layers</h4>
        </div>
        <ul>
          {RECORDS_QUEUE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a href={SOURCE_URLS.agendaCenter} target="_blank" rel="noopener noreferrer">
          Open the current archive
        </a>
      </div>
    </div>
  );
}
