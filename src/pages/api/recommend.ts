export const prerender = false;

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { CLAUDE_SONNET, extractText, stripFences } from "../../lib/models";
import { fetchRestaurantPhotos, fetchPexelsPhoto } from "../../lib/photoClient";
import { describeLevel } from "../../lib/greenLight/tasteProfile";
import { errJson, okJson } from "../../lib/apiHelpers";
import { logEvent } from "../../lib/logger";
import type {
  RecommendRequest,
  TasteProfile,
  DietaryConstraints,
} from "../../lib/greenLight/types";

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

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
  const dietary =
    constraints.dietary.length > 0
      ? constraints.dietary.join(", ")
      : "None";
  const disliked =
    constraints.disliked.length > 0
      ? constraints.disliked.join(", ")
      : "None";

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
    const body = (await request.json()) as RecommendRequest;
    const { restaurantName, location, tasteProfile, constraints } = body;

    if (!restaurantName || typeof restaurantName !== "string") {
      return errJson("Restaurant name is required", 400);
    }

    const trimmedName = restaurantName.trim();

    // Cap array inputs to prevent token inflation
    if (constraints?.dietary) {
      constraints.dietary = constraints.dietary.slice(0, 10);
    }
    if (constraints?.disliked) {
      constraints.disliked = constraints.disliked.slice(0, 20);
    }

    if (trimmedName.length > 200) {
      return errJson("Restaurant name too long (max 200 characters)", 400);
    }

    const safeLocation =
      typeof location === "string" && location.trim().length <= 100
        ? location.trim()
        : "Campbell, CA";

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
    let recommendation;
    try {
      recommendation = JSON.parse(cleaned);
    } catch {
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

    if (restaurantPhotos.length >= 2) {
      recommendation.optionA.photoUrl = restaurantPhotos[0];
      recommendation.optionB.photoUrl = restaurantPhotos[1];
    } else if (restaurantPhotos.length === 1) {
      recommendation.optionA.photoUrl = restaurantPhotos[0];
      if (recommendation.optionB.photoQuery) {
        const fallback = await fetchPexelsPhoto(
          recommendation.optionB.photoQuery,
          pexelsKey,
        );
        if (fallback) recommendation.optionB.photoUrl = fallback;
      }
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
    }

    const photoSource =
      restaurantPhotos.length >= 2
        ? "google-places"
        : restaurantPhotos.length === 1
          ? "google-places+pexels"
          : "pexels";

    logEvent("green-light-recommend", {
      restaurant: trimmedName,
      matched: recommendation.restaurantMatched,
      constraints: constraints.dietary,
      photoSource,
      photosFound: restaurantPhotos.length,
    });

    return okJson(recommendation, { "Cache-Control": "public, max-age=300" });
  } catch (err) {
    console.error("recommend error:", err);
    return errJson("Something went wrong", 500);
  }
};
