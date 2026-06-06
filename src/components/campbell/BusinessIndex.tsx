import { useMemo, useState } from "react";
import businessFeed from "../../data/campbellBusinesses.json";

interface CampbellBusinessRecord {
  name: string;
  phone: string;
  address: string;
  url: string;
  websiteUrl?: string;
  imageUrl?: string;
  description?: string;
  tags?: string[];
  source: string;
  sourceUrl: string;
  additionalSourceUrls?: string[];
}

type BusinessFilter = "all" | "downtown" | "chamber" | "both";

const BUSINESSES = businessFeed.items as CampbellBusinessRecord[];
const DOWNTOWN_COUNT = BUSINESSES.filter((business) => hasTag(business, "Downtown")).length;
const CHAMBER_COUNT = BUSINESSES.filter((business) => hasTag(business, "Chamber")).length;
const BOTH_COUNT = BUSINESSES.filter((business) => hasTag(business, "Downtown") && hasTag(business, "Chamber")).length;
const PHONE_COUNT = BUSINESSES.filter((business) => business.phone).length;
const BUSINESS_FILTERS: { id: BusinessFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "downtown", label: "Downtown" },
  { id: "chamber", label: "Chamber" },
  { id: "both", label: "Both sources" },
];
function hasTag(business: CampbellBusinessRecord, tag: string) {
  return business.tags?.includes(tag) ?? false;
}

function businessSourceLabel(business: CampbellBusinessRecord) {
  if (hasTag(business, "Downtown") && hasTag(business, "Chamber")) return "Downtown + Chamber";
  if (hasTag(business, "Downtown")) return "Downtown directory";
  if (hasTag(business, "Chamber")) return "Chamber member";
  return business.source;
}

export default function BusinessIndex() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<BusinessFilter>("all");

  const businesses = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return BUSINESSES.filter((business) => {
      if (activeFilter === "downtown" && !hasTag(business, "Downtown")) return false;
      if (activeFilter === "chamber" && !hasTag(business, "Chamber")) return false;
      if (activeFilter === "both" && !(hasTag(business, "Downtown") && hasTag(business, "Chamber"))) return false;
      if (!needle) return true;

      return [
        business.name,
        business.phone,
        business.address,
        business.description ?? "",
        business.source,
        ...(business.tags ?? []),
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [activeFilter, query]);
  const resultLabel = businesses.length === BUSINESSES.length ? "All businesses" : `${businesses.length} matches`;

  return (
    <div className="cb-businesses">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Businesses</span>
        <h3>Businesses around Campbell.</h3>
        <p>
          Browse downtown storefronts and Campbell-address Chamber members, then
          open the original listing for hours, menus, appointments, and details.
        </p>
      </div>

      <div className="cb-business-snapshot" aria-label="Campbell business directory snapshot">
        <div>
          <strong>{BUSINESSES.length}</strong>
          <span>Total listings</span>
        </div>
        <div>
          <strong>{DOWNTOWN_COUNT}</strong>
          <span>Downtown</span>
        </div>
        <div>
          <strong>{CHAMBER_COUNT}</strong>
          <span>Chamber</span>
        </div>
        <div>
          <strong>{BOTH_COUNT}</strong>
          <span>In both sources</span>
        </div>
        <div>
          <strong>{PHONE_COUNT}</strong>
          <span>Phone listed</span>
        </div>
      </div>

      <div className="cb-business-toolbar">
        <input
          type="text"
          className="cb-business-search"
          placeholder="Search by name, address, phone, or source"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="cb-business-count">{resultLabel}</span>
      </div>

      <div className="cb-business-filters" role="tablist" aria-label="Business source filters">
        {BUSINESS_FILTERS.map((filter) => (
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

      <div className="cb-business-grid">
        {businesses.map((business) => (
          <a
            key={`${business.name}-${business.address}`}
            className="cb-business-card"
            href={business.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="cb-business-category">{businessSourceLabel(business)}</span>
            <h4>{business.name}</h4>
            <p>{business.address || "Address not listed"}</p>
            {business.phone && <em>{business.phone}</em>}
            {business.description && <p className="cb-business-desc">{business.description}</p>}
            {business.websiteUrl && <span className="cb-business-web">Website listed</span>}
          </a>
        ))}
      </div>

      <div className="cb-source-note">
        <a href={businessFeed.sourceUrl} target="_blank" rel="noopener noreferrer">
          Open the Downtown source
        </a>
      </div>
    </div>
  );
}
