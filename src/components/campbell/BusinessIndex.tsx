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

interface BusinessSourceMeta {
  label: string;
  sourceUrl: string;
  count: number;
  totalParsed?: number;
}

type BusinessFilter = "all" | "downtown" | "chamber" | "both";

const feed = businessFeed as typeof businessFeed & { sources?: BusinessSourceMeta[] };
const BUSINESSES = feed.items as CampbellBusinessRecord[];
const SOURCE_COUNTS = feed.sources ?? [];
const BUSINESS_FILTERS: { id: BusinessFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "downtown", label: "Downtown" },
  { id: "chamber", label: "Chamber" },
  { id: "both", label: "Both sources" },
];
const generatedDate = new Date(businessFeed.generatedAt).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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

  const sourceStats = useMemo(() => ({
    downtownOnly: BUSINESSES.filter((business) => hasTag(business, "Downtown") && !hasTag(business, "Chamber")).length,
    chamberOnly: BUSINESSES.filter((business) => hasTag(business, "Chamber") && !hasTag(business, "Downtown")).length,
    both: BUSINESSES.filter((business) => hasTag(business, "Downtown") && hasTag(business, "Chamber")).length,
  }), []);

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

  return (
    <div className="cb-businesses">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Businesses</span>
        <h3>Downtown and Chamber business lists are live.</h3>
        <p>
          The index now merges Downtown Campbell's A-Z directory with
          Campbell-address members from the Chamber directory. It is not every
          storefront yet, but it is a much wider public baseline.
        </p>
      </div>

      <div className="cb-business-source-counts" aria-label="Business source counts">
        {SOURCE_COUNTS.map((source) => (
          <a
            key={source.label}
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{source.count}</span>
            <strong>{source.label}</strong>
            {source.totalParsed && <em>{source.totalParsed} parsed</em>}
          </a>
        ))}
      </div>

      <div className="cb-business-source-breakdown" aria-label="Merged business source breakdown">
        <span>{sourceStats.downtownOnly} Downtown only</span>
        <span>{sourceStats.chamberOnly} Chamber only</span>
        <span>{sourceStats.both} in both</span>
      </div>

      <div className="cb-business-toolbar">
        <input
          type="text"
          className="cb-business-search"
          placeholder="Search by name, address, phone, or source"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="cb-business-count">{businesses.length} of {BUSINESSES.length}</span>
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
        <span>Synced {generatedDate} from {businessFeed.items.length} merged public entries</span>
        <a href={businessFeed.sourceUrl} target="_blank" rel="noopener noreferrer">
          Open the Downtown source
        </a>
      </div>
    </div>
  );
}
