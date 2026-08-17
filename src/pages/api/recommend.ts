export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { CLAUDE_SONNET, extractText, stripFences, getAnthropicClient } from "../../lib/models";
import { fetchRestaurantPhotos, fetchPexelsPhoto } from "../../lib/photoClient";
import { describeLevel } from "../../lib/greenLight/tasteProfile";
import { errJson, devErrJson, okJson, toErrMsg } from "../../lib/apiHelpers";
import { logEvent } from "../../lib/logger";
import type { TasteProfile, DietaryConstraints } from "../../lib/greenLight/types";

const DEFAULT_LOCATION = "Campbell, CA";

// ─── Request validation ──────────────────────────────────────────────────────
// The body is attacker-controllable and every field below lands in the model
// prompt, so each is bounded here rather than just cast to its TS type — an
// unchecked cast meant a body missing `constraints` threw a TypeError (served
// as a generic 500) and callers could push unbounded strings into the prompt.
// Fields fall back instead of rejecting: a malformed taste profile should still
// return a recommendation, just a neutral one.

const DIETARY_LABELS = [
  "vegetarian",
  "pescatarian",
  "dairy-avoidant",
  "gluten-avoidant",
  "higher-protein",
  "lower-carb",
] as const;

const dimensionScore = z.number().min(-1).max(1).catch(0);

const TasteProfileSchema = z.object({
  spiceTolerance: dimensionScore,
  mealFormat: dimensionScore,
  cuisinePreference: dimensionScore,
  proteinPreference: dimensionScore,
  cookingMethod: dimensionScore,
  portionSize: dimensionScore,
  flavorProfile: dimensionScore,
  dietaryLeaning: dimensionScore,
});

const MAX_DIETARY_LABELS = 10;
const MAX_DISLIKED = 20;
const MAX_DISLIKED_LENGTH = 40;

/**
 * Lists drop only their bad entries rather than the whole array, so one
 * oversized ingredient doesn't silently discard the rest of someone's dislikes.
 */
const ConstraintsSchema = z.object({
  dietary: z
    .array(z.unknown())
    .catch([])
    .transform((labels) =>
      labels
        .filter((label): label is (typeof DIETARY_LABELS)[number] =>
          DIETARY_LABELS.includes(label as (typeof DIETARY_LABELS)[number]),
        )
        .slice(0, MAX_DIETARY_LABELS),
    ),
  disliked: z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= MAX_DISLIKED_LENGTH)
        .slice(0, MAX_DISLIKED),
    ),
  mealSize: z.enum(["lighter", "filling"]).catch("lighter"),
});

/** Coerce an unknown JSON value to a plain object so the schemas above always parse. */
function asRecord(value: unknown): Record<string, unknown> {
  const isPlainObject = typeof value === "object" && value !== null && !Array.isArray(value);
  return isPlainObject ? (value as Record<string, unknown>) : {};
}

const OptionSchema = z.object({
  order: z.string(),
  quickMods: z.array(z.string()).default([]),
  whyItWorks: z.array(z.string()).default([]),
  signals: z.record(z.string(), z.number()).default({}),
  photoQuery: z.string().optional(),
  photoUrl: z.string().optional(),
});

const RecommendationSchema = z.object({
  optionA: OptionSchema,
  optionB: OptionSchema,
  restaurantMatched: z.boolean(),
});

type Recommendation = z.infer<typeof RecommendationSchema>;

const client = getAnthropicClient();

const SYSTEM_PROMPT = `You are a health-conscious dining advisor. You know restaurant menus across the Bay Area, especially in Campbell, CA and the surrounding South Bay. You give confident, specific ordering advice.

RULES:
1. Recommend exactly TWO healthy menu items — different enough that picking one over the other reveals something about the person's taste. For example, one might be lighter/brighter while the other is heartier/richer, or one grilled and the other a bowl.
2. Both options must be genuinely healthy. "Healthy" means: nutrient-dense, reasonable portions, good protein-to-calorie ratio, not deep-fried as default. Not preachy — just smart choices.
3. Tone: calm, confident, direct. Like a knowledgeable friend, not a nutritionist. No exclamation marks. No "Great choice!" No hedging.
4. If you don't recognize the restaurant, use the cuisine type implied by the name and location to recommend based on common dishes at that type of restaurant. Set restaurantMatched to false.
5. For fast food restaurants, still give genuinely useful healthy-ish suggestions. Don't be judgmental.
6. Honor all dietary constraints absolutely. When constraints exist and the restaurant is unknown, lean conservative with safe choices.
7. Each order should be stated as a single imperative sentence.
8. For "signals": assign numeric values (-1 to 1) for the taste dimensions this choice leans toward. Only include dimensions where this choice clearly signals a preference. The two options should have contrasting signals on at least one dimension so we can learn from the user's pick.

TASTE DIMENSIONS for signals:
- spiceTolerance: -1 = mild, +1 = spicy
- mealFormat: -1 = bowls/composed, +1 = sandwiches/handhelds
- cuisinePreference: -1 = Western, +1 = Asian/Latin
- proteinPreference: -1 = plant-leaning, +1 = meat-forward
- cookingMethod: -1 = light/raw, +1 = cooked/crispy
- portionSize: -1 = lighter, +1 = hearty
- flavorProfile: -1 = clean/bright, +1 = rich/indulgent
- dietaryLeaning: -1 = health-conscious, +1 = comfort-forward

OUTPUT FORMAT — return valid JSON only, no markdown fences, no extra text:
{
  "optionA": {
    "order": "Imperative sentence, e.g. 'Order the grilled salmon bowl with brown rice — dressing on the side.'",
    "quickMods": ["1-2 short modification suggestions"],
    "whyItWorks": ["1 short bullet on why this fits"],
    "signals": { "flavorProfile": -0.6, "portionSize": -0.4 },
    "photoQuery": "grilled salmon rice bowl"
  },
  "optionB": {
    "order": "Imperative sentence for the contrasting option.",
    "quickMods": ["1-2 short modification suggestions"],
    "whyItWorks": ["1 short bullet on why this fits"],
    "signals": { "flavorProfile": 0.5, "portionSize": 0.3 },
    "photoQuery": "chicken avocado wrap"
  },
  "restaurantMatched": true
}

9. For "photoQuery": provide a short, generic food search term (2-4 words) that describes the dish visually. Use common food terms, not restaurant-specific names. Examples: "poke bowl", "grilled chicken salad", "fish tacos", "veggie burger".`;

function buildUserMessage(
  restaurantName: string,
  location: string,
  profile: TasteProfile,
  constraints: DietaryConstraints,
): string {
  const listOrNone = (items: string[]) => (items.length > 0 ? items.join(", ") : "None");
  const dietary = listOrNone(constraints.dietary);
  const disliked = listOrNone(constraints.disliked);

  return `Restaurant: ${restaurantName}
Location: ${location}

TASTE PROFILE:
- Spice tolerance: ${describeLevel(profile.spiceTolerance, "mild", "medium", "spicy")}
- Meal format preference: ${describeLevel(profile.mealFormat, "bowls and composed plates", "flexible", "sandwiches and handhelds")}
- Cuisine leaning: ${describeLevel(profile.cuisinePreference, "Western/American", "eclectic", "Asian/Latin")}
- Protein preference: ${describeLevel(profile.proteinPreference, "plant-leaning", "flexible", "meat-forward")}
- Cooking style: ${describeLevel(profile.cookingMethod, "light, raw, or fresh", "flexible", "cooked and crispy")}
- Portion preference: ${describeLevel(profile.portionSize, "lighter", "moderate", "hearty")}
- Flavor profile: ${describeLevel(profile.flavorProfile, "clean and bright", "balanced", "rich and indulgent")}
- Dietary leaning: ${describeLevel(profile.dietaryLeaning, "health-conscious", "balanced", "comfort-forward")}

CONSTRAINTS:
- Dietary: ${dietary}
- Disliked ingredients: ${disliked}
- Meal size: ${constraints.mealSize}

Give me TWO recommendations — both healthy, but different enough that my choice tells you something about my taste.`;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  try {
    const body = asRecord(await request.json());

    const { restaurantName, location } = body;
    if (typeof restaurantName !== "string" || !restaurantName.trim()) {
      return errJson("Restaurant name is required", 400);
    }
    const trimmedName = restaurantName.trim();
    if (trimmedName.length > 200) {
      return errJson("Restaurant name too long (max 200 characters)", 400);
    }

    const safeLocation =
      typeof location === "string" && location.trim() && location.trim().length <= 100
        ? location.trim()
        : DEFAULT_LOCATION;

    const tasteProfile = TasteProfileSchema.parse(asRecord(body.tasteProfile));
    const constraints = ConstraintsSchema.parse(asRecord(body.constraints));

    const userMessage = buildUserMessage(
      trimmedName,
      safeLocation,
      tasteProfile,
      constraints,
    );

    const message = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = extractText(message.content);

    if (!text) return errJson("Could not generate a recommendation", 500);

    const cleaned = stripFences(text);
    let recommendation: Recommendation;
    try {
      const parsed = JSON.parse(cleaned);
      recommendation = RecommendationSchema.parse(parsed);
    } catch (err) {
      console.error("recommend schema error:", err);
      return errJson("Failed to parse AI response", 502);
    }

    // Fetch real restaurant photos from Google Places, Pexels as fallback
    const placesKey = import.meta.env.GOOGLE_PLACES_API_KEY ?? "";
    const pexelsKey = import.meta.env.PEXELS_API_KEY ?? "";
    const restaurantPhotos = await fetchRestaurantPhotos(
      trimmedName,
      safeLocation,
      placesKey,
    );

    const photoCount = restaurantPhotos.length;

    // One pass over the three photo cases — each arm both assigns the photos and
    // names the source, so the two can't drift apart.
    let photoSource: string;
    if (photoCount >= 2) {
      recommendation.optionA.photoUrl = restaurantPhotos[0];
      recommendation.optionB.photoUrl = restaurantPhotos[1];
      photoSource = "google-places";
    } else if (photoCount === 1) {
      recommendation.optionA.photoUrl = restaurantPhotos[0];
      if (recommendation.optionB.photoQuery) {
        const fallback = await fetchPexelsPhoto(
          recommendation.optionB.photoQuery,
          pexelsKey,
        );
        if (fallback) recommendation.optionB.photoUrl = fallback;
      }
      photoSource = "google-places+pexels";
    } else {
      const [photoA, photoB] = await Promise.all([
        recommendation.optionA.photoQuery
          ? fetchPexelsPhoto(recommendation.optionA.photoQuery, pexelsKey)
          : null,
        recommendation.optionB.photoQuery
          ? fetchPexelsPhoto(recommendation.optionB.photoQuery, pexelsKey)
          : null,
      ]);
      if (photoA) recommendation.optionA.photoUrl = photoA;
      if (photoB) recommendation.optionB.photoUrl = photoB;
      photoSource = "pexels";
    }

    logEvent("green-light-recommend", {
      restaurant: trimmedName,
      matched: recommendation.restaurantMatched,
      constraints: constraints.dietary,
      photoSource,
      photosFound: photoCount,
    });

    return okJson(recommendation, { "Cache-Control": "public, max-age=300" });
  } catch (err) {
    console.error("recommend error:", err);
    return devErrJson("Something went wrong", toErrMsg(err));
  }
};
