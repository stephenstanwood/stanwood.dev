import { useMemo, useState } from "react";
import businessFeed from "../../data/campbellBusinesses.json";
import GhostInput from "./GhostInput";

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
const BUSINESS_DISPLAY_LIMIT = 48;
const DOWNTOWN_COUNT = BUSINESSES.filter((business) => hasTag(business, "Downtown")).length;
const CHAMBER_COUNT = BUSINESSES.filter((business) => hasTag(business, "Chamber")).length;
const BOTH_COUNT = BUSINESSES.filter((business) => hasTag(business, "Downtown") && hasTag(business, "Chamber")).length;
const PHONE_COUNT = BUSINESSES.filter((business) => business.phone).length;
const BUSINESS_SOURCES = businessFeed.sources ?? [
  { label: "Downtown Campbell Directory", sourceUrl: businessFeed.sourceUrl },
];
const BUSINESS_FILTERS: { id: BusinessFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "downtown", label: "Downtown" },
  { id: "chamber", label: "Chamber list" },
  { id: "both", label: "Both lists" },
];
function hasTag(business: CampbellBusinessRecord, tag: string) {
  return business.tags?.includes(tag) ?? false;
}

const BUSINESS_NAMES = Array.from(new Set(BUSINESSES.map((business) => business.name)));

const MONO_TONES = ["blue", "gold", "green", "red", "clay"] as const;

function monogramTone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return MONO_TONES[Math.abs(hash) % MONO_TONES.length];
}

function directoryLabel(label: string) {
  if (label === "Downtown Campbell Directory") return "Downtown directory";
  if (label === "Campbell Chamber Directory") return "Chamber directory";
  return label;
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
  const [showAll, setShowAll] = useState(false);

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
  const resultLabel = businesses.length === BUSINESSES.length ? `${businesses.length} listed` : `${businesses.length} matches`;
  const visibleBusinesses = showAll ? businesses : businesses.slice(0, BUSINESS_DISPLAY_LIMIT);
  const hiddenBusinessCount = businesses.length - visibleBusinesses.length;
  const filtersAreActive = query.trim().length > 0 || activeFilter !== "all";

  function clearFilters() {
    setQuery("");
    setActiveFilter("all");
    setShowAll(false);
  }

  return (
    <div className="cb-businesses">
      <div className="cb-business-snapshot" aria-label="Campbell business directory snapshot">
        <div>
          <strong>{BUSINESSES.length}</strong>
          <span>Places listed</span>
        </div>
        <div>
          <strong>{DOWNTOWN_COUNT}</strong>
          <span>Downtown storefronts</span>
        </div>
        <div>
          <strong>{CHAMBER_COUNT}</strong>
          <span>Chamber listings</span>
        </div>
        <div>
          <strong>{BOTH_COUNT}</strong>
          <span>Listed both ways</span>
        </div>
        <div>
          <strong>{PHONE_COUNT}</strong>
          <span>Phone available</span>
        </div>
      </div>

      <div className="cb-business-toolbar">
        <GhostInput
          className="cb-business-search"
          placeholder="Search by name, address, phone, or service"
          ariaLabel="Search businesses"
          value={query}
          candidates={BUSINESS_NAMES}
          onValueChange={(value) => {
            setQuery(value);
            setShowAll(false);
          }}
        />
        <span className="cb-business-count">{resultLabel}</span>
        {filtersAreActive && (
          <button type="button" className="cb-filter-reset" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <div className="cb-business-filters" role="group" aria-label="Business source filters">
        {BUSINESS_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilter === filter.id ? "is-active" : ""}
            onClick={() => {
              setActiveFilter(filter.id);
              setShowAll(false);
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="cb-business-grid">
        {visibleBusinesses.map((business) => {
          const href = business.websiteUrl || business.url;
          const linkLabel = business.websiteUrl ? "Open website" : "Open listing";

          return (
            <a
              key={`${business.name}-${business.address}`}
              className="cb-business-card"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                className={`cb-biz-mono cb-biz-mono--${monogramTone(business.name)}`}
                aria-hidden="true"
              >
                {business.name.charAt(0).toUpperCase()}
              </span>
              <span className="cb-business-body">
                <span className="cb-business-category">{businessSourceLabel(business)}</span>
                <h4>{business.name}</h4>
                <p>{business.address || "Address not listed"}</p>
                {business.phone && <em>{business.phone}</em>}
                {business.description && <p className="cb-business-desc">{business.description}</p>}
                <span className="cb-business-link">{linkLabel}</span>
              </span>
            </a>
          );
        })}
      </div>

      {businesses.length === 0 && (
        <div className="cb-business-empty">
          No businesses match these filters yet. Clear a filter or search another term.
        </div>
      )}

      {hiddenBusinessCount > 0 && (
        <button
          type="button"
          className="cb-business-more"
          onClick={() => setShowAll(true)}
        >
          Show {hiddenBusinessCount} more places
        </button>
      )}

      <div className="cb-source-note">
        {BUSINESS_SOURCES.map((source, index) => (
          <span key={source.sourceUrl}>
            {index > 0 && " · "}
            <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
              Open {directoryLabel(source.label)}
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}
