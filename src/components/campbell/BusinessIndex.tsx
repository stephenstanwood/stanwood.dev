import { useMemo, useState } from "react";
import businessFeed from "../../data/campbellBusinesses.json";

interface DowntownBusiness {
  name: string;
  phone: string;
  address: string;
  url: string;
  source: string;
  sourceUrl: string;
}

const BUSINESSES = businessFeed.items as DowntownBusiness[];
const generatedDate = new Date(businessFeed.generatedAt).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function BusinessIndex() {
  const [query, setQuery] = useState("");

  const businesses = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return BUSINESSES.filter((business) => {
      if (!needle) return true;

      return [business.name, business.phone, business.address]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [query]);

  return (
    <div className="cb-businesses">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Businesses</span>
        <h3>Start with downtown. Expand to every storefront.</h3>
        <p>
          This is the full public Downtown Campbell A-Z directory, synced into
          local data with profile links, phone numbers, addresses, and source
          freshness.
        </p>
      </div>

      <div className="cb-business-toolbar">
        <input
          type="text"
          className="cb-business-search"
          placeholder="Search by name, address, or category"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="cb-business-count">{businesses.length} of {BUSINESSES.length}</span>
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
            <span className="cb-business-category">Downtown directory</span>
            <h4>{business.name}</h4>
            <p>{business.address || "Address not listed"}</p>
            {business.phone && <em>{business.phone}</em>}
          </a>
        ))}
      </div>

      <div className="cb-source-note">
        <span>Synced {generatedDate} from {businessFeed.items.length} public entries</span>
        <a href={businessFeed.sourceUrl} target="_blank" rel="noopener noreferrer">
          Open the full Downtown Campbell directory
        </a>
      </div>
    </div>
  );
}
