import { useState } from "react";
import type { DietaryConstraints as Constraints, DietaryLabel } from "../../lib/greenLight/types";

const DIETARY_OPTIONS: { value: DietaryLabel; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "dairy-avoidant", label: "Dairy-free" },
  { value: "gluten-avoidant", label: "Gluten-free" },
  { value: "higher-protein", label: "High protein" },
  { value: "lower-carb", label: "Lower carb" },
];

interface Props {
  initial: Constraints;
  onComplete: (constraints: Constraints) => void;
}

export default function DietaryConstraints({ initial, onComplete }: Props) {
  const [dietary, setDietary] = useState<DietaryLabel[]>(initial.dietary);
  const [dislikedText, setDislikedText] = useState(initial.disliked.join(", "));
  const [mealSize, setMealSize] = useState<"lighter" | "filling">(initial.mealSize);

  function toggleDietary(value: DietaryLabel) {
    setDietary((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  }

  function handleContinue() {
    const disliked = dislikedText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onComplete({ dietary, disliked, mealSize });
  }

  return (
    <div className="he-constraints">
      <h2 className="he-section-title">Any dietary preferences?</h2>
      <p className="he-section-sub">Optional — skip if none apply</p>

      {/* Dietary toggles */}
      <div className="he-chips">
        {DIETARY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`he-chip ${dietary.includes(opt.value) ? "he-chip-active" : ""}`}
            onClick={() => toggleDietary(opt.value)}
            aria-pressed={dietary.includes(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Disliked ingredients */}
      <label className="he-field-label" htmlFor="disliked">
        Ingredients you dislike
      </label>
      <input
        id="disliked"
        type="text"
        className="he-input"
        placeholder="e.g., cilantro, olives, anchovies"
        value={dislikedText}
        onChange={(e) => setDislikedText(e.target.value)}
      />

      {/* Meal size */}
      <div className="he-meal-size">
        <span className="he-field-label">Typical meal size</span>
        <div className="he-toggle-group">
          <button
            type="button"
            className={`he-toggle ${mealSize === "lighter" ? "he-toggle-active" : ""}`}
            onClick={() => setMealSize("lighter")}
            aria-pressed={mealSize === "lighter"}
          >
            Lighter
          </button>
          <button
            type="button"
            className={`he-toggle ${mealSize === "filling" ? "he-toggle-active" : ""}`}
            onClick={() => setMealSize("filling")}
            aria-pressed={mealSize === "filling"}
          >
            Filling
          </button>
        </div>
      </div>

      {/* Continue button */}
      <button
        type="button"
        className="he-btn-primary"
        onClick={handleContinue}
      >
        Find my order
      </button>
    </div>
  );
}
