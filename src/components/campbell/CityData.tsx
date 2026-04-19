import { useState } from "react";

interface Stat {
  label: string;
  value: string;
  sub: string;
  icon: string;
}

const STATS: Stat[] = [
  { icon: "👥", label: "Population",        value: "42,924",    sub: "2020 US Census" },
  { icon: "🏠", label: "Median home value", value: "$1.32M",    sub: "Zillow estimate, 2024" },
  { icon: "💰", label: "Median household income", value: "$111K", sub: "ACS 5-yr, 2019–2023" },
  { icon: "📐", label: "City area",         value: "5.8 sq mi", sub: "5.7 land, 0.1 water" },
  { icon: "🏙️", label: "Pop. density",      value: "7,400/mi²", sub: "Land area basis" },
  { icon: "📅", label: "Incorporated",      value: "1952",      sub: "City of Campbell" },
  { icon: "🎓", label: "Bachelor's or higher", value: "58%",    sub: "Adults 25+, ACS 2019–2023" },
  { icon: "🔑", label: "Renter-occupied",   value: "53%",       sub: "Housing units" },
  { icon: "🧑", label: "Median age",        value: "38.1 yrs",  sub: "ACS 5-yr, 2019–2023" },
];

const GIS_LINKS = [
  { label: "Zoning Map",       desc: "Residential, commercial, industrial districts", href: "https://gis.campbellca.gov/public" },
  { label: "Parks & Facilities", desc: "Community centers, pools, parks",            href: "https://www.campbellca.gov/Facilities" },
  { label: "ArcGIS REST API",  desc: "Queryable city data layers for developers",    href: "https://gis.campbellca.gov/arcgis/rest/services/" },
];

export default function CityData() {
  const [showGis, setShowGis] = useState(false);

  return (
    <div className="cb-data">
      {/* City identity bar */}
      <div className="cb-data-identity">
        <span className="cb-data-identity-name">Campbell, CA</span>
        <span className="cb-data-identity-meta">Santa Clara County · Silicon Valley</span>
      </div>

      {/* Stat grid */}
      <div className="cb-data-stat-grid">
        {STATS.map((s) => (
          <div key={s.label} className="cb-data-stat">
            <span className="cb-data-stat-icon">{s.icon}</span>
            <div className="cb-data-stat-body">
              <span className="cb-data-stat-value">{s.value}</span>
              <span className="cb-data-stat-label">{s.label}</span>
              <span className="cb-data-stat-sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* GIS / open data section */}
      <div className="cb-data-footer">
        <button
          className="cb-data-gis-toggle"
          onClick={() => setShowGis((v) => !v)}
          aria-expanded={showGis}
        >
          {showGis ? "Hide" : "GIS & open data"} {showGis ? "↑" : "↓"}
        </button>
        {showGis && (
          <div className="cb-data-gis-list">
            {GIS_LINKS.map((g) => (
              <a
                key={g.label}
                href={g.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cb-data-gis-link"
              >
                <span className="cb-data-gis-label">{g.label}</span>
                <span className="cb-data-gis-desc">{g.desc}</span>
              </a>
            ))}
            <p className="cb-data-gis-note">
              Campbell doesn't publish a full open data portal yet.
              The ArcGIS REST API has queryable endpoints for some layers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
