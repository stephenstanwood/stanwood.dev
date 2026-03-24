import type { SiteAnalysis } from "../../lib/redesignRolodex/types";

export default function CurrentSiteCard({
  analysis,
  screenshotBase64,
}: {
  analysis: SiteAnalysis;
  screenshotBase64: string;
}) {
  return (
    <div className="rr-card rr-card-current">
      <div className="rr-card-number">Card 1</div>
      <div className="rr-card-label-tag">Current Site</div>
      <div className="rr-card-screenshot">
        <img
          src={`data:image/png;base64,${screenshotBase64}`}
          alt={`Screenshot of ${analysis.title}`}
          draggable={false}
        />
      </div>
      <div className="rr-card-info">
        <h3 className="rr-card-title">{analysis.title}</h3>
        <p className="rr-card-desc">{analysis.description}</p>
        <div className="rr-card-style-notes">
          <span className="rr-style-tag">{analysis.fontVibe}</span>
          <span className="rr-style-tag">{analysis.colorVibe}</span>
          <span className="rr-style-tag rr-style-tag-accent">
            {analysis.toneTag}
          </span>
        </div>
      </div>
    </div>
  );
}
