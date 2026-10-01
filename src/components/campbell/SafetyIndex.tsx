import {
  SAFETY_LAYERS,
  SAFETY_METRICS,
  SAFETY_SOURCES,
  SOURCE_URLS,
} from "../../data/campbell";
import SourceCardGrid from "./SourceCardGrid";
import LayerList from "./LayerList";
import MetricStrip from "./MetricStrip";

const SAFETY_SHORTCUTS = [
  {
    label: "Report a non-emergency crime",
    body: "Use CPD's report page for eligible incidents inside Campbell city limits. Call 911 for emergencies.",
    href: SOURCE_URLS.reportCrime,
  },
  {
    label: "Open the crime map",
    body: "CityProtect is the official public map, with block-level generalization and privacy filtering.",
    href: SOURCE_URLS.cityProtect,
  },
  {
    label: "Read media logs",
    body: "Open Campbell Police Department incident summaries in the posted PDFs.",
    href: SOURCE_URLS.cpdMediaLogs,
  },
  {
    label: "Request police records",
    body: "Start here for formal records requests, copies, and records-counter information.",
    href: SOURCE_URLS.cpdRecords,
  },
];

const SAFETY_START_HERE = [
  {
    label: "Emergency",
    body: "Call 911 for in-progress crimes, immediate danger, fire, or medical emergencies.",
  },
  {
    label: "Report online",
    body: "Use CPD's online report path for eligible non-emergency incidents in Campbell.",
    href: SOURCE_URLS.reportCrime,
  },
  {
    label: "See the map",
    body: "Open CityProtect for the official public crime map, generalized by block.",
    href: SOURCE_URLS.cityProtect,
  },
  {
    label: "Read logs",
    body: "Use CPD media logs for recent official incident summaries and context.",
    href: SOURCE_URLS.cpdMediaLogs,
  },
];

export default function SafetyIndex() {
  return (
    <div className="cb-safety">
      <div className="cb-safety-start" aria-label="Campbell safety start here">
        {SAFETY_START_HERE.map((item) => {
          const content = (
            <>
              <strong>{item.label}</strong>
              <span>{item.body}</span>
            </>
          );

          return item.href ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="cb-safety-start-card"
            >
              {content}
            </a>
          ) : (
            <article key={item.label} className="cb-safety-start-card">
              {content}
            </article>
          );
        })}
      </div>

      <MetricStrip
        metrics={SAFETY_METRICS}
        className="cb-safety-metrics"
        metricClassName="cb-safety-metric"
        ariaLabel="Campbell public safety metrics"
      />

      <div className="cb-section-head cb-safety-layer-head">
        <span className="cb-section-kicker">Official paths</span>
        <h3>Police reports, maps, and policies</h3>
        <p>
          Open Campbell police records, incident summaries, and public oversight
          pages.
        </p>
      </div>

      <LayerList layers={SAFETY_LAYERS} prefix="cb-safety" />

      <div className="cb-safety-shortcuts" aria-label="Official Campbell safety shortcuts">
        {SAFETY_SHORTCUTS.map((shortcut) => (
          <a
            key={shortcut.label}
            href={shortcut.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-safety-shortcut"
          >
            <strong>{shortcut.label}</strong>
            <span>{shortcut.body}</span>
          </a>
        ))}
      </div>

      <SourceCardGrid sources={SAFETY_SOURCES} />
    </div>
  );
}
