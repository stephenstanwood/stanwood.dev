// ─── Taste Dimensions ────────────────────────────────────────────────────────

export type TasteDimension =
  | "spiceTolerance"
  | "mealFormat"
  | "cuisinePreference"
  | "proteinPreference"
  | "cookingMethod"
  | "portionSize"
  | "flavorProfile"
  | "dietaryLeaning";

export interface DimensionScores {
  spiceTolerance: number;
  mealFormat: number;
  cuisinePreference: number;
  proteinPreference: number;
  cookingMethod: number;
  portionSize: number;
  flavorProfile: number;
  dietaryLeaning: number;
}

export type TasteProfile = DimensionScores;

// ─── Quiz ────────────────────────────────────────────────────────────────────

export interface QuizChoice {
  label: string;
  subtitle?: string;
  dimensions: Partial<DimensionScores>;
}

export interface QuizQuestion {
  id: number;
  optionA: QuizChoice;
  optionB: QuizChoice;
  primaryDimension: TasteDimension;
}

export interface QuizAnswer {
  questionId: number;
  selected: "A" | "B";
}

// ─── Constraints ─────────────────────────────────────────────────────────────

export type DietaryLabel =
  | "vegetarian"
  | "pescatarian"
  | "dairy-avoidant"
  | "gluten-avoidant"
  | "higher-protein"
  | "lower-carb";

export interface DietaryConstraints {
  dietary: DietaryLabel[];
  disliked: string[];
  mealSize: "lighter" | "filling";
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface RecommendRequest {
  restaurantName: string;
  location: string;
  tasteProfile: TasteProfile;
  constraints: DietaryConstraints;
}

export interface Recommendation {
  order: string;
  quickMods: string[];
  whyItWorks: string[];
  signals: Partial<DimensionScores>;
  photoQuery?: string;
  photoUrl?: string;
}

export interface RecommendResponse {
  optionA: Recommendation;
  optionB: Recommendation;
  restaurantMatched: boolean;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface StoredProfile {
  version: 1;
  profile: TasteProfile;
  constraints: DietaryConstraints;
  quizAnswers: QuizAnswer[];
  recentRestaurants: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── App State ───────────────────────────────────────────────────────────────

export type AppView = "quiz" | "constraints" | "search" | "loading" | "picking" | "result";
