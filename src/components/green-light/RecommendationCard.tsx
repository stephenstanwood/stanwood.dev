import type { Recommendation, RecommendResponse } from "../../lib/greenLight/types";

// ─── Picker: show two options side by side ──────────────────────────────────

interface PickerProps {
  response: RecommendResponse;
  restaurantName: string;
  onPick: (choice: "A" | "B") => void;
}

/** One of the two side-by-side order options. */
function PickerOption({
  option,
  choice,
  onPick,
}: {
  option: Recommendation;
  choice: "A" | "B";
  onPick: (choice: "A" | "B") => void;
}) {
  return (
    <button
      type="button"
      className="he-picker-card"
      onClick={() => onPick(choice)}
      aria-label={`Pick: ${option.order}`}
    >
      {option.photoUrl && (
        <div className="he-picker-photo">
          <img src={option.photoUrl} alt="" loading="lazy" />
        </div>
      )}
      <p className="he-picker-order">{option.order}</p>
      {option.whyItWorks.length > 0 && (
        <p className="he-picker-why">{option.whyItWorks[0]}</p>
      )}
    </button>
  );
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
        <PickerOption option={response.optionA} choice="A" onPick={onPick} />
        <span className="he-picker-or">or</span>
        <PickerOption option={response.optionB} choice="B" onPick={onPick} />
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

/** A titled bullet list inside the result card; renders nothing when empty. */
function ResultSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="he-result-section">
      <h4 className="he-result-subhead">{title}</h4>
      <ul className="he-result-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function RecommendationResult({
  recommendation,
  onTryAgain,
  onNewSearch,
}: ResultProps) {
  return (
    <div className="he-result">
      <div className="he-result-card">
        {recommendation.photoUrl && (
          <div className="he-result-photo">
            <img src={recommendation.photoUrl} alt="" loading="lazy" />
          </div>
        )}
        <h3 className="he-result-heading">Your order</h3>
        <p className="he-result-order">{recommendation.order}</p>

        <ResultSection title="Quick mods" items={recommendation.quickMods} />
        <ResultSection title="Why it works" items={recommendation.whyItWorks} />
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
