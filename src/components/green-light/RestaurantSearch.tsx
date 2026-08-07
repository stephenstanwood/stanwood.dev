import { useState, type SyntheticEvent } from "react";
import type { TasteDimension, TasteProfile } from "../../lib/greenLight/types";

interface Props {
  recentRestaurants: string[];
  savedCity: string;
  profile: TasteProfile | null;
  onSearch: (name: string, city: string) => void;
  onRetakeQuiz: () => void;
}

/** A dimension only earns a vibe label once it leans this far off center. */
const VIBE_THRESHOLD = 0.33;
const MAX_VIBES = 4;

/** [dimension, label when strongly positive, label when strongly negative] */
const VIBE_LABELS: Array<[TasteDimension, string, string]> = [
  ["spiceTolerance", "loves heat", "keeps it mild"],
  ["proteinPreference", "meat-forward", "plant-forward"],
  ["portionSize", "big plates", "lighter eater"],
  ["flavorProfile", "bold & smoky", "clean & bright"],
  ["dietaryLeaning", "full indulgence", "health-conscious"],
  ["cuisinePreference", "global palate", "classic flavors"],
  ["cookingMethod", "grilled & fried", "raw & fresh"],
  ["mealFormat", "composed plates", "bowls & builds"],
];

/** The profile's strongest leanings, as short human labels, strongest first. */
function getVibeLabels(profile: TasteProfile): string[] {
  return VIBE_LABELS.map(([dimension, highLabel, lowLabel]) => {
    const score = profile[dimension];
    if (score > VIBE_THRESHOLD) return { label: highLabel, strength: score };
    if (score < -VIBE_THRESHOLD) return { label: lowLabel, strength: -score };
    return null;
  })
    .filter((vibe) => vibe !== null)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, MAX_VIBES)
    .map((vibe) => vibe.label);
}

export default function RestaurantSearch({
  recentRestaurants,
  savedCity,
  profile,
  onSearch,
  onRetakeQuiz,
}: Props) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(savedCity);

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    const cityTrimmed = city.trim();
    if (trimmed && cityTrimmed) onSearch(trimmed, cityTrimmed);
  }

  function handleRecent(name: string) {
    setQuery(name);
    const cityTrimmed = city.trim();
    if (cityTrimmed) onSearch(name, cityTrimmed);
  }

  const canSubmit = query.trim() && city.trim();

  const vibes = profile ? getVibeLabels(profile) : [];

  return (
    <div className="he-search">
      {vibes.length > 0 && (
        <div className="he-vibes">
          <span className="he-vibes-label">Your vibe</span>
          <div className="he-vibes-list">
            {vibes.map((v) => (
              <span key={v} className="he-vibe-tag">
                {v}
              </span>
            ))}
          </div>
          <p className="he-vibes-note">Learns from every pick you make.</p>
        </div>
      )}
      <h2 className="he-section-title">Where are you eating?</h2>

      <form onSubmit={handleSubmit} className="he-search-form">
        <input
          type="text"
          className="he-input he-input-lg"
          placeholder="Restaurant name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label="Restaurant name"
        />
        <input
          type="text"
          className="he-input"
          placeholder="City (e.g. Portland, OR)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="City"
        />
        <button
          type="submit"
          className="he-btn-primary"
          disabled={!canSubmit}
        >
          Get my order
        </button>
      </form>

      {recentRestaurants.length > 0 && (
        <div className="he-recent">
          <span className="he-recent-label">Recent</span>
          <div className="he-recent-list">
            {recentRestaurants.map((name) => (
              <button
                key={name}
                type="button"
                className="he-recent-item"
                onClick={() => handleRecent(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="he-link-btn"
        onClick={onRetakeQuiz}
      >
        Retake taste quiz
      </button>
    </div>
  );
}
