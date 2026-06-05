import {
  SAFETY_LAYERS,
  SAFETY_METRICS,
  SAFETY_SOURCES,
} from "../../data/campbell";
import SourceCardGrid from "./SourceCardGrid";

const SAFETY_RULES = [
  {
    label: "Official first",
    body: "Prefer CPD, CityProtect, council records, and posted policies before third-party crime scores.",
  },
  {
    label: "Context before ranking",
    body: "Explain what happened, where the data comes from, and what it leaves out before making comparisons.",
  },
  {
    label: "Privacy floor",
    body: "Keep victim-level details, people-search dossiers, and panic-map framing out of the guide.",
  },
];

export default function SafetyIndex() {
  return (
    <div className="cb-safety">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Safety</span>
        <h3>Crime reports, police data, and public-safety context.</h3>
        <p>
          Campbell residents need quick answers: what to do, where official data
          lives, what public meetings are coming, and how much confidence to put
          in each source. This starts with CPD statistics, CityProtect, online
          reporting, and transparency records.
        </p>
      </div>

      <div className="cb-safety-metrics" aria-label="Campbell public safety metrics">
        {SAFETY_METRICS.map((metric) => (
          <a
            key={metric.label}
            href={metric.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-safety-metric"
          >
            <span>{metric.value}</span>
            <strong>{metric.label}</strong>
            <em>{metric.note}</em>
          </a>
        ))}
      </div>

      <div className="cb-section-head cb-safety-layer-head">
        <span className="cb-section-kicker">Source Reality</span>
        <h3>Useful crime coverage without turning people into content.</h3>
        <p>
          Crime data is public, but not all public data should be republished as
          raw rows. The stronger version explains official reports, map limits,
          meeting dates, policies, and patterns in plain English.
        </p>
      </div>

      <div className="cb-safety-layer-list">
        {SAFETY_LAYERS.map((layer) => (
          <a
            key={layer.label}
            href={layer.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-safety-layer"
          >
            <div className="cb-safety-layer-top">
              <h4>{layer.label}</h4>
              <span className={`cb-safety-status cb-safety-status--${layer.status.toLowerCase()}`}>
                {layer.status}
              </span>
            </div>
            <p>{layer.body}</p>
            <em>{layer.sourceLabel}</em>
          </a>
        ))}
      </div>

      <div className="cb-safety-rules" aria-label="Safety publishing rules">
        {SAFETY_RULES.map((rule) => (
          <article key={rule.label} className="cb-safety-rule">
            <span>{rule.label}</span>
            <p>{rule.body}</p>
          </article>
        ))}
      </div>

      <SourceCardGrid sources={SAFETY_SOURCES} />

      <p className="cb-privacy-note">
        Next step: extract annual reports, public-safety hearings, and
        neighborhood-level trends from official sources. Do not publish
        victim-identifying incident rows or synthetic danger scores.
      </p>
    </div>
  );
}
