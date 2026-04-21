import type { DesignDirection, WeirdnessMode, SiteAnalysis } from "../../lib/redesignRolodex/types";
import { buildCopyPrompt } from "../../lib/redesignRolodex/buildCopyPrompt";
import CopyPromptButton from "./CopyPromptButton";

export default function DesignDirectionCard({
  direction,
  url,
  analysis,
  mode,
}: {
  direction: DesignDirection;
  url: string;
  analysis: SiteAnalysis;
  mode: WeirdnessMode;
}) {
  const prompt = buildCopyPrompt(url, analysis, direction, mode);

  return (
    <div className="rr-card rr-card-direction">
      <div className="rr-card-number">Card {direction.id}</div>
      <div className="rr-card-concept">
        <iframe
          srcDoc={direction.conceptHtml}
          sandbox="allow-same-origin"
          title={`${direction.name} concept`}
          className="rr-concept-iframe"
          loading="lazy"
        />
      </div>
      <div className="rr-card-info">
        <h3 className="rr-card-title">{direction.name}</h3>
        <p className="rr-card-tagline">{direction.tagline}</p>
        <div className="rr-card-palette">
          {direction.palette.map((hex, i) => (
            <span
              key={i}
              className="rr-swatch"
              style={{ background: hex }}
              title={hex}
            />
          ))}
        </div>
        <p className="rr-card-font-dir">{direction.fontDirection}</p>
        <CopyPromptButton prompt={prompt} />
      </div>
    </div>
  );
}
