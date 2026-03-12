import type {
  ModelProfile,
  Recommendation,
  RecommendResult,
  TaskWeights,
  Trait,
  TraitScores,
} from "./types";
import { ALL_TRAITS, TRAIT_LABELS } from "./types";
import { MODELS } from "./models";

function normalizeWeights(weights: Partial<TraitScores>): TraitScores {
  const entries = Object.entries(weights) as [Trait, number][];
  const sum = entries.reduce((acc, [, v]) => acc + v, 0);
  const normalized = {} as TraitScores;
  for (const t of ALL_TRAITS) {
    normalized[t] = sum > 0 ? (weights[t] ?? 0) / sum : 0;
  }
  return normalized;
}

function scoreModel(
  model: ModelProfile,
  weights: TraitScores,
): number {
  let score = 0;
  for (const t of ALL_TRAITS) {
    score += weights[t] * model.traits[t];
  }
  return Math.round(score * 10);
}

function topTraits(weights: Partial<TraitScores>, n = 2): Trait[] {
  return (Object.entries(weights) as [Trait, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => t);
}

function generateWhy(
  model: ModelProfile,
  taskLabel: string,
  weights: Partial<TraitScores>,
): string {
  const top = topTraits(weights);
  const traitNames = top.map((t) => TRAIT_LABELS[t].toLowerCase());

  const templates = [
    `${model.name} is a strong pick for ${taskLabel} — it excels at ${traitNames.join(" and ")}.`,
    `For ${taskLabel}, ${model.name} hits the sweet spot on ${traitNames.join(" and ")}.`,
    `${model.name} shines here. ${TRAIT_LABELS[top[0]]} is its bread and butter${top[1] ? `, and ${TRAIT_LABELS[top[1]].toLowerCase()} doesn't hurt either` : ""}.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export function recommend(taskWeights: TaskWeights): RecommendResult {
  const { weights, label } = taskWeights;
  const norm = normalizeWeights(weights);

  const scored: { model: ModelProfile; score: number }[] = MODELS.map(
    (model) => ({
      model,
      score: scoreModel(model, norm),
    }),
  );

  scored.sort((a, b) => b.score - a.score);

  const primary: Recommendation = {
    model: scored[0].model,
    score: scored[0].score,
    whySentence: generateWhy(scored[0].model, label, weights),
  };

  const alternates: Recommendation[] = scored.slice(1, 3).map((s) => ({
    model: s.model,
    score: s.score,
    whySentence: generateWhy(s.model, label, weights),
  }));

  const ifYouCareMore = buildIfYouCareMore(scored, weights, primary.model);

  return { primary, alternates, ifYouCareMore, taskLabel: label };
}

function buildIfYouCareMore(
  scored: { model: ModelProfile; score: number }[],
  weights: Partial<TraitScores>,
  primaryModel: ModelProfile,
): RecommendResult["ifYouCareMore"] {
  const result: RecommendResult["ifYouCareMore"] = [];
  const seen = new Set<string>([primaryModel.id]);

  const interestingTraits: Trait[] = [
    "speed",
    "cost",
    "open_source",
    "image_gen",
    "long_context",
  ];

  for (const trait of interestingTraits) {
    if (result.length >= 3) break;

    const leader = MODELS.reduce((best, m) =>
      m.traits[trait] > best.traits[trait] ? m : best,
    );

    if (seen.has(leader.id)) continue;
    if (leader.traits[trait] <= primaryModel.traits[trait]) continue;

    seen.add(leader.id);
    result.push({
      trait: TRAIT_LABELS[trait].toLowerCase(),
      model: leader,
      reason: `${leader.name} leads on ${TRAIT_LABELS[trait].toLowerCase()} (${leader.traits[trait]}/10).`,
    });
  }

  return result;
}
