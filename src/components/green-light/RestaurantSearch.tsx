import { useState } from "react";
import type { TasteProfile } from "../../lib/greenLight/types";

interface Props {
  recentRestaurants: string[];
  savedCity: string;
  profile: TasteProfile | null;
  onSearch: (name: string, city: string) => void;
  onRetakeQuiz: () => void;
}

function getVibeLabels(profile: TasteProfile): string[] {
  const candidates: Array<{ label: string; strength: number }> = [
    {
      label:
        profile.spiceTolerance > 0.33
          ? "loves heat"
          : profile.spiceTolerance < -0.33
            ? "keeps it mild"
            : "",
      strength: Math.abs(profile.spiceTolerance),
    },
    {
      label:
        profile.proteinPreference > 0.33
          ? "meat-forward"
          : profile.proteinPreference < -0.33
            ? "plant-forward"
            : "",
      strength: Math.abs(profile.proteinPreference),
    },
    {
      label:
        profile.portionSize > 0.33
          ? "big plates"
          : profile.portionSize < -0.33
            ? "lighter eater"
            : "",
      strength: Math.abs(profile.portionSize),
    },
    {
      label:
        profile.flavorProfile > 0.33
          ? "bold & smoky"
          : profile.flavorProfile < -0.33
            ? "clean & bright"
            : "",
      strength: Math.abs(profile.flavorProfile),
    },
    {
      label:
        profile.dietaryLeaning > 0.33
          ? "full indulgence"
          : profile.dietaryLeaning < -0.33
            ? "health-conscious"
            : "",
      strength: Math.abs(profile.dietaryLeaning),
    },
    {
      label:
        profile.cuisinePreference > 0.33
          ? "global palate"
          : profile.cuisinePreference < -0.33
            ? "classic flavors"
            : "",
      strength: Math.abs(profile.cuisinePreference),
    },
    {
      label:
        profile.cookingMethod > 0.33
          ? "grilled & fried"
          : profile.cookingMethod < -0.33
            ? "raw & fresh"
            : "",
      strength: Math.abs(profile.cookingMethod),
    },
    {
      label:
        profile.mealFormat > 0.33
          ? "composed plates"
          : profile.mealFormat < -0.33
            ? "bowls & builds"
            : "",
      strength: Math.abs(profile.mealFormat),
    },
  ];

  return candidates
    .filter((c) => c.label !== "")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4)
    .map((c) => c.label);
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

  function handleSubmit(e: React.FormEvent) {
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
