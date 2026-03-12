export type Trait =
  | "writing"
  | "coding"
  | "image_gen"
  | "image_understanding"
  | "speed"
  | "cost"
  | "reasoning"
  | "long_context"
  | "multimodal"
  | "open_source"
  | "ecosystem";

export const ALL_TRAITS: Trait[] = [
  "writing",
  "coding",
  "image_gen",
  "image_understanding",
  "speed",
  "cost",
  "reasoning",
  "long_context",
  "multimodal",
  "open_source",
  "ecosystem",
];

export const TRAIT_LABELS: Record<Trait, string> = {
  writing: "Writing",
  coding: "Coding",
  image_gen: "Image Generation",
  image_understanding: "Image Understanding",
  speed: "Speed",
  cost: "Cost Efficiency",
  reasoning: "Reasoning",
  long_context: "Long Context",
  multimodal: "Multimodal",
  open_source: "Open Source",
  ecosystem: "Ecosystem",
};

export type TraitScores = Record<Trait, number>;

export interface ModelProfile {
  id: string;
  name: string;
  org: string;
  emoji: string;
  shortLabel: string;
  color: string;
  traits: TraitScores;
  bestFor: string[];
  watchOuts: string[];
  tagline: string;
}

export interface TaskWeights {
  weights: Partial<TraitScores>;
  label: string;
}

export interface Recommendation {
  model: ModelProfile;
  score: number;
  whySentence: string;
}

export interface RecommendResult {
  primary: Recommendation;
  alternates: Recommendation[];
  ifYouCareMore: Array<{
    trait: string;
    model: ModelProfile;
    reason: string;
  }>;
  taskLabel: string;
}

export interface QuizChoice {
  label: string;
  emoji: string;
  weights: Partial<TraitScores>;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  optionA: QuizChoice;
  optionB: QuizChoice;
}

export type AppView = "start" | "freetext" | "quiz" | "revealing" | "result";
