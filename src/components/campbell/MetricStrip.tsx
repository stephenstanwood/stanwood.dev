import type { CampbellMetric } from "../../data/campbell";

interface Props {
  metrics: CampbellMetric[];
  /** Wrapper class, e.g. `cb-metric-strip` or `cb-property-metrics`. */
  className: string;
  /** Per-metric link class, e.g. `cb-mini-metric` or `cb-property-metric`. */
  metricClassName: string;
  ariaLabel?: string;
}

/**
 * The linked value/label/note metric tiles shared by the history, real estate
 * and safety sections. Markup is identical; campbell.astro styles each strip
 * off its class names.
 */
export default function MetricStrip({ metrics, className, metricClassName, ariaLabel }: Props) {
  return (
    <div className={className} aria-label={ariaLabel}>
      {metrics.map((metric) => (
        <a
          key={metric.label}
          href={metric.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={metricClassName}
        >
          <span>{metric.value}</span>
          <strong>{metric.label}</strong>
          <em>{metric.note}</em>
        </a>
      ))}
    </div>
  );
}
