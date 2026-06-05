import type { CampbellSource } from "../../data/campbell";

interface SourceCardGridProps {
  sources: CampbellSource[];
}

export default function SourceCardGrid({ sources }: SourceCardGridProps) {
  return (
    <div className="cb-source-grid">
      {sources.map((source) => (
        <a
          key={source.href}
          href={source.href}
          target="_blank"
          rel="noopener noreferrer"
          className="cb-source-card"
        >
          <span className="cb-source-eyebrow">{source.owner}</span>
          <span className="cb-source-title">{source.label}</span>
          <span className="cb-source-why">{source.why}</span>
          <span className="cb-source-meta">{source.cadence}</span>
        </a>
      ))}
    </div>
  );
}
