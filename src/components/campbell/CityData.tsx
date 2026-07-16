import { useState } from "react";
import { ChevronDown, ChevronUp, Map as MapIcon } from "lucide-react";
import { CAMPBELL_METRICS, SOURCE_URLS } from "../../data/campbell";

const MAP_LINKS = [
  { label: "Zoning map", desc: "Residential, commercial, and industrial districts", href: SOURCE_URLS.cityGisPublic },
  { label: "Parks and facilities", desc: "Community centers, pools, parks, and city buildings", href: "https://www.campbellca.gov/Facilities" },
  { label: "Active projects map", desc: "Planning projects and location-specific development notes", href: SOURCE_URLS.activeProjectsMap },
];

export default function CityData() {
  const [showMapLinks, setShowMapLinks] = useState(false);
  const ToggleIcon = showMapLinks ? ChevronUp : ChevronDown;

  return (
    <div className="cb-data">
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
          onClick={() => setShowMapLinks((v) => !v)}
          aria-expanded={showMapLinks}
          aria-controls="campbell-map-links"
        >
          <span>
            <MapIcon size={16} strokeWidth={2.2} aria-hidden="true" />
            {showMapLinks ? "Hide maps and data" : "Maps and city data"}
          </span>
          <ToggleIcon size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
        {showMapLinks && (
          <div className="cb-data-gis-list" id="campbell-map-links">
            {MAP_LINKS.map((g) => (
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
              Campbell does not publish one single public data site yet.
              These links cover the useful public maps residents can open now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
