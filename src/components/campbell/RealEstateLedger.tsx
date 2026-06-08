import {
  PROPERTY_LAYERS,
  PROPERTY_METRICS,
  REAL_ESTATE_SOURCES,
  SOURCE_URLS,
} from "../../data/campbell";
import SourceCardGrid from "./SourceCardGrid";

const LEDGER_FIELDS = [
  { label: "Parcel", body: "APN, jurisdiction, tax-rate area, lot, zoning, and map links." },
  { label: "Assessment", body: "Assessed value, base-year clues, exemptions, and roll changes where public." },
  { label: "Transfers", body: "Recorded deeds, transfer-tax hints, and document references without publishing owner dossiers." },
  { label: "Permits", body: "Planning, building, code, and public-hearing records tied back to addresses." },
];

const PROPERTY_SHORTCUTS = [
  {
    label: "Find active projects",
    body: "Open the city's active-projects map for planning files and location-specific development context.",
    href: SOURCE_URLS.activeProjectsMap,
  },
  {
    label: "Apply or check permits",
    body: "MGO is the city's portal for permit applications, complaints, and building workflows.",
    href: SOURCE_URLS.permitPortal,
  },
  {
    label: "Research planning records",
    body: "Use the city archive for older planning documents, historical project files, and address research.",
    href: SOURCE_URLS.planningRecords,
  },
  {
    label: "Starter home rules",
    body: "Read Campbell's SB 684 / SB 1123 starter-home project guidance and eligibility notes.",
    href: SOURCE_URLS.starterHomeProjects,
  },
];

const SALES_FEED_STATUS = [
  {
    label: "Sales feed",
    status: "Not live yet",
    body: "A real Campbell sales feed needs official transfer fields, not scraped listing blurbs.",
    href: SOURCE_URLS.assessorRecords,
  },
  {
    label: "Likely official fields",
    status: "Assessor path",
    body: "The county assessor describes records that can include buyer, seller, APN, property address, transfer date, recording date, document number, and indicated sales price.",
    href: SOURCE_URLS.assessorRecords,
  },
  {
    label: "Recorder data",
    status: "Index only",
    body: "The Clerk-Recorder data subscription is useful for recorded-document references, but the office says it is document-index data, not a property sales database.",
    href: SOURCE_URLS.clerkRecorderDataSales,
  },
];

export default function RealEstateLedger() {
  return (
    <div className="cb-homes">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Homes</span>
        <h3>A public-records ledger, not a gossip page.</h3>
        <p>
          Campbell property data lives across county assessment records, recorder
          documents, city permits, zoning maps, and public hearings. The good
          version explains the property, sale, permit, and neighborhood
          context without turning residents into content.
        </p>
      </div>

      <div className="cb-property-metrics" aria-label="Campbell property roll metrics">
        {PROPERTY_METRICS.map((metric) => (
          <a
            key={metric.label}
            href={metric.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-property-metric"
          >
            <span>{metric.value}</span>
            <strong>{metric.label}</strong>
            <em>{metric.note}</em>
          </a>
        ))}
      </div>

      <div className="cb-ledger-grid">
        {LEDGER_FIELDS.map((field) => (
          <article key={field.label} className="cb-ledger-card">
            <span>{field.label}</span>
            <p>{field.body}</p>
          </article>
        ))}
      </div>

      <div className="cb-property-shortcuts" aria-label="Campbell property and permit shortcuts">
        {PROPERTY_SHORTCUTS.map((shortcut) => (
          <a
            key={shortcut.label}
            href={shortcut.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-property-shortcut"
          >
            <strong>{shortcut.label}</strong>
            <span>{shortcut.body}</span>
          </a>
        ))}
      </div>

      <div className="cb-sales-status" aria-label="Campbell real estate sales feed status">
        {SALES_FEED_STATUS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-sales-status-card"
          >
            <div>
              <strong>{item.label}</strong>
              <em>{item.status}</em>
            </div>
            <p>{item.body}</p>
          </a>
        ))}
      </div>

      <div className="cb-section-head cb-property-layer-head">
        <span className="cb-section-kicker">Source Reality</span>
        <h3>What can become a real sales ledger?</h3>
        <p>
          Start with public parcel and permit context, then use official transfer
          fields when the data path is complete. Sale rumors and scraped
          people-search dossiers stay out.
        </p>
      </div>

      <div className="cb-property-layer-list">
        {PROPERTY_LAYERS.map((layer) => (
          <a
            key={layer.label}
            href={layer.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-property-layer"
          >
            <div className="cb-property-layer-top">
              <h4>{layer.label}</h4>
              <span className={`cb-property-status cb-property-status--${layer.status.toLowerCase()}`}>
                {layer.status}
              </span>
            </div>
            <p>{layer.body}</p>
            <em>{layer.sourceLabel}</em>
          </a>
        ))}
      </div>

      <SourceCardGrid sources={REAL_ESTATE_SOURCES} />

      <p className="cb-privacy-note">
        Real estate documents are public records, but this guide should publish
        address-level facts, document references, and market context - not
        unnecessary personal profiles.
      </p>
    </div>
  );
}
