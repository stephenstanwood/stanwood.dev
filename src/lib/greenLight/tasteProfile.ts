import type {
  QuizAnswer,
  QuizQuestion,
  TasteProfile,
  TasteDimension,
  DimensionScores,
} from "./types";
import { clamp } from "../math";

const ALL_DIMENSIONS: TasteDimension[] = [
  "spiceTolerance",
  "mealFormat",
  "cuisinePreference",
  "proteinPreference",
  "cookingMethod",
  "portionSize",
  "flavorProfile",
  "dietaryLeaning",
];

function zeroedDimensions(): Record<TasteDimension, number> {
  return Object.fromEntries(ALL_DIMENSIONS.map((dim) => [dim, 0])) as Record<
    TasteDimension,
    number
  >;
}

export function computeTasteProfile(
  answers: QuizAnswer[],
  questions: QuizQuestion[],
): TasteProfile {
  const sums = zeroedDimensions();
  const counts = zeroedDimensions();

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const choice =
      answer.selected === "A" ? question.optionA : question.optionB;

    for (const [dim, value] of Object.entries(choice.dimensions)) {
      const dimension = dim as TasteDimension;
      sums[dimension] += value as number;
      counts[dimension] += 1;
    }
  }

  const profile = {} as TasteProfile;
  for (const dim of ALL_DIMENSIONS) {
    profile[dim] = counts[dim] > 0 ? clamp(sums[dim] / counts[dim], -1, 1) : 0;
  }
  return profile;
}

/**
 * Nudge the taste profile toward the signals of the chosen option.
 * Uses a small learning rate so each restaurant choice gently refines
 * the profile without overwriting what the quiz established.
 */
const LEARN_RATE = 0.15;

export function nudgeProfile(
  current: TasteProfile,
  chosenSignals: Partial<DimensionScores>,
): TasteProfile {
  const updated = { ...current };
  for (const [dim, value] of Object.entries(chosenSignals)) {
    const dimension = dim as TasteDimension;
    if (typeof value === "number") {
      updated[dimension] = clamp(current[dimension] + LEARN_RATE * value, -1, 1);
    }
  }
  return updated;
}

export function describeLevel(
  score: number,
  low: string,
  mid: string,
  high: string,
): string {
  if (score < -0.33) return low;
  if (score > 0.33) return high;
  return mid;
}
