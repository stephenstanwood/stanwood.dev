import { CAMPBELL_HISTORY, CAMPBELL_METRICS } from "../../data/campbell";

export default function HistoryTimeline() {
  return (
    <div className="cb-history">
      <div className="cb-history-timeline">
        {CAMPBELL_HISTORY.map((item) => (
          <article key={item.year} className={`cb-history-item${item.image ? " cb-history-item--photo" : ""}`}>
            <span className="cb-history-year">{item.year}</span>
            <div className="cb-history-body">
              <h4>{item.title}</h4>
              <p>{item.body}</p>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                {item.sourceLabel}
              </a>
            </div>
            {item.image && (
              <figure className="cb-history-photo">
                <img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
              </figure>
            )}
          </article>
        ))}
      </div>

      <div className="cb-metric-strip">
        {CAMPBELL_METRICS.slice(0, 3).map((metric) => (
          <a
            key={metric.label}
            href={metric.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cb-mini-metric"
          >
            <span>{metric.value}</span>
            <strong>{metric.label}</strong>
            <em>{metric.note}</em>
          </a>
        ))}
      </div>
    </div>
  );
}
