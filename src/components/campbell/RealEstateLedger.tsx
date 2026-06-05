import {
  PROPERTY_LAYERS,
  PROPERTY_METRICS,
  REAL_ESTATE_SOURCES,
} from "../../data/campbell";
import SourceCardGrid from "./SourceCardGrid";

const LEDGER_FIELDS = [
  { label: "Parcel", body: "APN, jurisdiction, tax-rate area, lot, zoning, and map links." },
  { label: "Assessment", body: "Assessed value, base-year clues, exemptions, and roll changes where public." },
  { label: "Transfers", body: "Recorded deeds, transfer-tax hints, and document references without publishing owner dossiers." },
  { label: "Permits", body: "Planning, building, code, and public-hearing records tied back to addresses." },
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
          version should explain the property, sale, permit, and neighborhood
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

      <div className="cb-section-head cb-property-layer-head">
        <span className="cb-section-kicker">Source Reality</span>
        <h3>What can become a real sales ledger?</h3>
        <p>
          The useful version starts with public parcel and permit context, then
          adds official transfer fields once the data path is clean enough to be
          complete. Sale rumors and scraped people-search dossiers stay out.
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
        Real estate documents are public records, but the eventual ledger should
        publish address-level facts, document references, and market context -
        not unnecessary personal profiles.
      </p>
    </div>
  );
}
