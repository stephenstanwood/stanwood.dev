import { REAL_ESTATE_SOURCES } from "../../data/campbell";
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

      <div className="cb-ledger-grid">
        {LEDGER_FIELDS.map((field) => (
          <article key={field.label} className="cb-ledger-card">
            <span>{field.label}</span>
            <p>{field.body}</p>
          </article>
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
