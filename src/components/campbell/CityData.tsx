import { useState, useCallback } from "react";
import type { GisLayer } from "../../lib/campbell/types";

const LAYERS: GisLayer[] = [
  {
    id: "zoning",
    name: "Zoning Map",
    description: "City zoning districts — residential, commercial, industrial, and mixed-use designations",
    count: null,
    url: "https://gis.campbellca.gov/public",
  },
  {
    id: "business",
    name: "Business Licenses",
    description: "Active business licenses registered with the city",
    count: null,
    url: "https://gis.campbellca.gov/public",
  },
  {
    id: "shopping",
    name: "Shopping Centers",
    description: "Major shopping centers and commercial areas",
    count: null,
    url: "https://gis.campbellca.gov/public",
  },
  {
    id: "parks",
    name: "Parks & Facilities",
    description: "City parks, community centers, pools, and public facilities",
    count: null,
    url: "https://www.campbellca.gov/Facilities",
  },
];

export default function CityData() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="cb-data">
      <p className="cb-data-intro">
        Campbell publishes GIS data through ArcGIS but has no open data portal.
        Here's what's publicly available.
      </p>

      <div className="cb-data-layers">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            className={`cb-data-card ${expanded === layer.id ? "cb-data-card--open" : ""}`}
            onClick={() => toggle(layer.id)}
          >
            <div className="cb-data-card-header">
              <h4 className="cb-data-name">{layer.name}</h4>
              <span className="cb-data-toggle">{expanded === layer.id ? "−" : "+"}</span>
            </div>
            {expanded === layer.id && (
              <div className="cb-data-card-body">
                <p>{layer.description}</p>
                <a
                  href={layer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cb-data-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Explore on map →
                </a>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="cb-data-footer">
        <p className="cb-data-note">
          Want this data as JSON or CSV? Campbell doesn't publish open datasets yet.
          If you're a developer or researcher, the{" "}
          <a
            href="https://gis.campbellca.gov/arcgis/rest/services/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ArcGIS REST API
          </a>{" "}
          has queryable endpoints for some layers.
        </p>
      </div>
    </div>
  );
}
