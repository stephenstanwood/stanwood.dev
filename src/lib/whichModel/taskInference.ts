import type { TaskWeights, TraitScores, Trait } from "./types";

interface KeywordRule {
  patterns: RegExp[];
  weights: Partial<TraitScores>;
  label: string;
}

const RULES: KeywordRule[] = [
  {
    patterns: [/\b(writ|article|essay|copywriting|marketing|copy|prose|content|blog.?post)\b/i],
    weights: { writing: 9, reasoning: 4 },
    label: "writing",
  },
  {
    patterns: [/\b(code|coding|program|debug|refactor|typescript|python|javascript|rust|go|java|swift|dev)\b/i],
    weights: { coding: 9, reasoning: 5 },
    label: "coding",
  },
  {
    patterns: [/\b(react|vue|angular|next|svelte|frontend|front.?end|component|ui)\b/i],
    weights: { coding: 9, ecosystem: 4 },
    label: "frontend coding",
  },
  {
    patterns: [/\b(generat|creat|mak).{0,10}(image|picture|art|illustration|visual|photo|graphic)\b/i],
    weights: { image_gen: 10 },
    label: "image generation",
  },
  {
    patterns: [/\b(image|picture|photo|screenshot|diagram|chart).{0,15}(analy|understand|describ|read|extract|ocr)\b/i],
    weights: { image_understanding: 9, multimodal: 5 },
    label: "image understanding",
  },
  {
    patterns: [/\b(analyz|understand|describ|read|extract).{0,15}(image|picture|photo|screenshot|diagram)\b/i],
    weights: { image_understanding: 9, multimodal: 5 },
    label: "image understanding",
  },
  {
    patterns: [/\b(fast|quick|real.?time|latency|instant|speed)\b/i],
    weights: { speed: 9, cost: 3 },
    label: "speed-sensitive",
  },
  {
    patterns: [/\b(cheap|free|budget|low.?cost|affordable|inexpensive)\b/i],
    weights: { cost: 9, open_source: 3 },
    label: "budget-conscious",
  },
  {
    patterns: [/\b(open.?source|self.?host|local|on.?prem|privacy|private)\b/i],
    weights: { open_source: 9, cost: 4 },
    label: "open-source / self-hosted",
  },
  {
    patterns: [/\b(long|huge|large|big|massive).{0,10}(doc|document|pdf|context|file|text)\b/i],
    weights: { long_context: 9, reasoning: 4 },
    label: "long document work",
  },
  {
    patterns: [/\b(pdf|document|summariz|summary|report)\b/i],
    weights: { long_context: 6, writing: 5, reasoning: 5 },
    label: "document processing",
  },
  {
    patterns: [/\b(csv|spreadsheet|data|dataset|excel|table|analytics)\b/i],
    weights: { reasoning: 7, coding: 5, long_context: 4 },
    label: "data analysis",
  },
  {
    patterns: [/\b(math|calcul|equation|proof|logic|puzzle)\b/i],
    weights: { reasoning: 10, coding: 3 },
    label: "math and logic",
  },
  {
    patterns: [/\b(chat|convers|brainstorm|idea|creative|think|explore)\b/i],
    weights: { writing: 6, reasoning: 6, speed: 4 },
    label: "brainstorming",
  },
  {
    patterns: [/\b(api|integrat|workflow|automat|pipeline|tool)\b/i],
    weights: { ecosystem: 8, speed: 4, coding: 3 },
    label: "API / workflow integration",
  },
  {
    patterns: [/\b(email|message|letter|correspondence|reply|draft)\b/i],
    weights: { writing: 8, speed: 5 },
    label: "email and messaging",
  },
  {
    patterns: [/\b(translat|multilingual|language|locali[sz])\b/i],
    weights: { writing: 7, multimodal: 4, reasoning: 3 },
    label: "translation",
  },
  {
    patterns: [/\b(video|audio|voice|transcri|podcast)\b/i],
    weights: { multimodal: 9, long_context: 4 },
    label: "audio/video work",
  },
  {
    patterns: [/\b(research|learn|study|understand|explain)\b/i],
    weights: { reasoning: 8, writing: 4, long_context: 3 },
    label: "research",
  },
];

export function inferWeights(input: string): TaskWeights {
  const merged: Partial<TraitScores> = {};
  const matchedLabels: string[] = [];

  for (const rule of RULES) {
    const matched = rule.patterns.some((p) => p.test(input));
    if (!matched) continue;

    matchedLabels.push(rule.label);
    for (const [trait, value] of Object.entries(rule.weights) as [Trait, number][]) {
      merged[trait] = Math.max(merged[trait] ?? 0, value);
    }
  }

  if (Object.keys(merged).length === 0) {
    return {
      weights: { writing: 5, coding: 5, reasoning: 5, speed: 5, cost: 5 },
      label: "general use",
    };
  }

  const label =
    matchedLabels.length <= 2
      ? matchedLabels.join(" + ")
      : `${matchedLabels[0]} + ${matchedLabels.length - 1} more`;

  return { weights: merged, label };
}
