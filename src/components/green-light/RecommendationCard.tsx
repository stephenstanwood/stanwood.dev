import type { Recommendation, RecommendResponse } from "../../lib/greenLight/types";

// ─── Picker: show two options side by side ──────────────────────────────────

interface PickerProps {
  response: RecommendResponse;
  restaurantName: string;
  onPick: (choice: "A" | "B") => void;
}

export function RecommendationPicker({
  response,
  restaurantName,
  onPick,
}: PickerProps) {
  return (
    <div className="he-picker">
      {!response.restaurantMatched && (
        <p className="he-result-note">
          We're not 100% sure about this menu, but here are our best calls.
        </p>
      )}

      <h2 className="he-picker-title">
        Two good options at {restaurantName}
      </h2>
      <p className="he-picker-sub">Tap the one that sounds better</p>

      <div className="he-picker-cards">
        <button
          type="button"
          className="he-picker-card"
          onClick={() => onPick("A")}
          aria-label={`Pick: ${response.optionA.order}`}
        >
          <p className="he-picker-order">{response.optionA.order}</p>
          {response.optionA.whyItWorks.length > 0 && (
            <p className="he-picker-why">{response.optionA.whyItWorks[0]}</p>
          )}
        </button>

        <span className="he-picker-or">or</span>

        <button
          type="button"
          className="he-picker-card"
          onClick={() => onPick("B")}
          aria-label={`Pick: ${response.optionB.order}`}
        >
          <p className="he-picker-order">{response.optionB.order}</p>
          {response.optionB.whyItWorks.length > 0 && (
            <p className="he-picker-why">{response.optionB.whyItWorks[0]}</p>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Result: show the selected order expanded ───────────────────────────────

interface ResultProps {
  recommendation: Recommendation;
  onTryAgain: () => void;
  onNewSearch: () => void;
}

export function RecommendationResult({
  recommendation,
  onTryAgain,
  onNewSearch,
}: ResultProps) {
  return (
    <div className="he-result">
      <div className="he-result-card">
        <h3 className="he-result-heading">Your order</h3>
        <p className="he-result-order">{recommendation.order}</p>

        {recommendation.quickMods.length > 0 && (
          <div className="he-result-section">
            <h4 className="he-result-subhead">Quick mods</h4>
            <ul className="he-result-list">
              {recommendation.quickMods.map((mod, i) => (
                <li key={i}>{mod}</li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.whyItWorks.length > 0 && (
          <div className="he-result-section">
            <h4 className="he-result-subhead">Why it works</h4>
            <ul className="he-result-list">
              {recommendation.whyItWorks.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="he-actions">
        <button type="button" className="he-btn-secondary" onClick={onTryAgain}>
          New suggestions
        </button>
        <button type="button" className="he-btn-primary" onClick={onNewSearch}>
          Different restaurant
        </button>
      </div>
    </div>
  );
}
