import { useState } from "react";
import { CAMPBELL_METRICS, SOURCE_URLS } from "../../data/campbell";

const GIS_LINKS = [
  { label: "Zoning Map",       desc: "Residential, commercial, industrial districts", href: SOURCE_URLS.cityGisPublic },
  { label: "Parks & Facilities", desc: "Community centers, pools, parks",            href: "https://www.campbellca.gov/Facilities" },
  { label: "ArcGIS REST API",  desc: "Queryable city data layers for developers",    href: SOURCE_URLS.cityGis },
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

      <div className="cb-data-stat-grid">
        {CAMPBELL_METRICS.map((s) => (
          <a
            key={s.label}
            className="cb-data-stat"
            href={s.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="cb-data-stat-body">
              <span className="cb-data-stat-value">{s.value}</span>
              <span className="cb-data-stat-label">{s.label}</span>
              <span className="cb-data-stat-sub">{s.note}</span>
            </div>
          </a>
        ))}
      </div>

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
