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

const RECORDS_QUEUE = [
  "Full-text agenda packet extraction",
  "Plain-English summaries for every public hearing",
  "Planning Commission and Historic Preservation Board vote outcomes",
  "Budget, fee schedule, and capital projects",
  "Public notices and city contracts",
  "Zoning, parcels, and map layers",
];

const COUNCIL_RECORDS = (councilFeed.items as CouncilRecord[]).slice(0, 8);
const PUBLIC_HEARINGS = (hearingFeed.items as PublicHearing[]).slice(0, 10);

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

export default function CivicRecords() {
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
          </div>
          <span>{PUBLIC_HEARINGS.length} indexed · synced {formatGeneratedAt(hearingFeed.generatedAt)}</span>
        </div>

        <div className="cb-hearing-list">
          {PUBLIC_HEARINGS.map((item) => (
            <article className="cb-hearing-card" key={item.id}>
              <div className="cb-hearing-topline">
                <span>{item.body}</span>
                <em>{item.sourceType}</em>
              </div>
              <h4>{item.title}</h4>
              <p className="cb-hearing-when">
                {item.hearingAt || "Date is in the official notice packet"}
              </p>
              <p className="cb-hearing-summary">
                {item.extractionNote ? "Large official packet: open the notice for the complete date, plans, and project materials." : plainSummary(item.summary)}
              </p>
              {(item.address || item.fileNo || item.planner) && (
                <div className="cb-hearing-meta">
                  {item.address && <span>{item.address}</span>}
                  {item.fileNo && <span>{item.fileNo}</span>}
                  {item.planner && <span>{item.planner}</span>}
                </div>
              )}
              <div className="cb-record-links">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Official agenda
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
      </section>

      <section className="cb-live-record-panel" aria-label="Campbell council agenda and minutes records">
        <div className="cb-live-record-head">
          <div>
            <span className="cb-live-record-kicker">Agenda Center</span>
            <h4>Council packets, minutes, and media</h4>
          </div>
          <span>{councilFeed.items.length} records · synced {formatGeneratedAt(councilFeed.generatedAt)}</span>
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
