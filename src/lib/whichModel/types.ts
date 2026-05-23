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
