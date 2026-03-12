import type { RecommendResult } from "../../lib/whichModel/types";

interface Props {
  result: RecommendResult;
  onTryAgain: () => void;
}

export default function ResultCard({ result, onTryAgain }: Props) {
  const { primary, alternates, ifYouCareMore, taskLabel } = result;

  return (
    <div className="wm-result">
      <div className="wm-result-header">
        <p className="wm-result-task">
          For <strong>{taskLabel}</strong>, the wheel landed on:
        </p>
      </div>

      {/* Primary recommendation */}
      <div
        className="wm-primary-card"
        style={{ borderLeftColor: primary.model.color }}
      >
        <div className="wm-primary-top">
          <span className="wm-primary-emoji">{primary.model.emoji}</span>
          <div>
            <h2 className="wm-primary-name">Use {primary.model.name}</h2>
            <p className="wm-primary-org">{primary.model.org}</p>
          </div>
          <span className="wm-fit-badge">{primary.score}% fit</span>
        </div>

        <p className="wm-primary-tagline">{primary.model.tagline}</p>
        <p className="wm-primary-why">{primary.whySentence}</p>

        <div className="wm-primary-lists">
          <div className="wm-list-col">
            <h4>Best for</h4>
            <ul>
              {primary.model.bestFor.map((b) => (
                <li key={b}>✓ {b}</li>
              ))}
            </ul>
          </div>
          <div className="wm-list-col">
            <h4>Watch out</h4>
            <ul>
              {primary.model.watchOuts.map((w) => (
                <li key={w}>⚠ {w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Alternates */}
      {alternates.length > 0 && (
        <div className="wm-alternates">
          <h3 className="wm-section-heading">Runners-up</h3>
          <div className="wm-alt-grid">
            {alternates.map((alt) => (
              <div
                key={alt.model.id}
                className="wm-alt-card"
                style={{ borderLeftColor: alt.model.color }}
              >
                <div className="wm-alt-top">
                  <span className="wm-alt-emoji">{alt.model.emoji}</span>
                  <span className="wm-alt-name">{alt.model.name}</span>
                  <span className="wm-alt-score">{alt.score}%</span>
                </div>
                <p className="wm-alt-why">{alt.whySentence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If you care more about... */}
      {ifYouCareMore.length > 0 && (
        <div className="wm-care-more">
          <h3 className="wm-section-heading">If you care more about...</h3>
          <div className="wm-care-list">
            {ifYouCareMore.map((item) => (
              <div key={item.trait} className="wm-care-item">
                <span className="wm-care-trait">{item.trait}</span>
                <span className="wm-care-arrow">→</span>
                <span className="wm-care-model">
                  {item.model.emoji} {item.model.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wm-actions">
        <button className="wm-try-again" onClick={onTryAgain}>
          🎡 Spin again
        </button>
      </div>
    </div>
  );
}
