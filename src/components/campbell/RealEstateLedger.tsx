import {
  PROPERTY_LAYERS,
  PROPERTY_METRICS,
  REAL_ESTATE_SOURCES,
  SOURCE_URLS,
} from "../../data/campbell";
import SourceCardGrid from "./SourceCardGrid";
import LayerList from "./LayerList";
import MetricStrip from "./MetricStrip";

const PROPERTY_SHORTCUTS = [
  {
    label: "Find active projects",
    body: "Open the city's active-projects map for planning files and location-specific development context.",
    href: SOURCE_URLS.activeProjectsMap,
  },
  {
    label: "Apply or check permits",
    body: "MGO is the city's portal for permit applications, complaints, and building workflows.",
    href: SOURCE_URLS.permitPortal,
  },
  {
    label: "Research planning records",
    body: "Use the city archive for older planning documents, historical project files, and address research.",
    href: SOURCE_URLS.planningRecords,
  },
  {
    label: "Starter home rules",
    body: "Read Campbell's SB 684 / SB 1123 starter-home project guidance and eligibility notes.",
    href: SOURCE_URLS.starterHomeProjects,
  },
];

export default function RealEstateLedger() {
  return (
    <div className="cb-homes">
      <MetricStrip
        metrics={PROPERTY_METRICS}
        className="cb-property-metrics"
        metricClassName="cb-property-metric"
        ariaLabel="Campbell property roll metrics"
      />

      <div className="cb-property-shortcuts" aria-label="Campbell property and permit shortcuts">
        {PROPERTY_SHORTCUTS.map((shortcut) => (
          <a
            key={shortcut.label}
            href={shortcut.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-property-shortcut"
          >
            <strong>{shortcut.label}</strong>
            <span>{shortcut.body}</span>
          </a>
        ))}
      </div>

      <div className="cb-section-head cb-property-layer-head">
        <span className="cb-section-kicker">Property records</span>
        <h3>Look up a Campbell property</h3>
        <p>
          Find parcel details, assessed values, recorded documents, maps, and
          building records through city and county services.
        </p>
      </div>

      <LayerList layers={PROPERTY_LAYERS} prefix="cb-property" />

      <SourceCardGrid sources={REAL_ESTATE_SOURCES} />
    </div>
  );
}
