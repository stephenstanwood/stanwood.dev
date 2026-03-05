import type { QuizQuestion } from "./types";

export const quizQuestions: QuizQuestion[] = [
  // ── Spice Tolerance (Q1–Q3) ───────────────────────────────────────────────
  {
    id: 1,
    primaryDimension: "spiceTolerance",
    optionA: {
      label: "Garlic butter shrimp",
      subtitle: "Rich and savory",
      emoji: "\u{1F990}",
      dimensions: { spiceTolerance: -0.8, cookingMethod: 0.4 },
    },
    optionB: {
      label: "Spicy Thai basil stir-fry",
      subtitle: "Chili-forward heat",
      emoji: "\u{1F336}\u{FE0F}",
      dimensions: { spiceTolerance: 0.8, cuisinePreference: 0.6 },
    },
  },
  {
    id: 2,
    primaryDimension: "spiceTolerance",
    optionA: {
      label: "Classic margherita pizza",
      subtitle: "Simple and mild",
      emoji: "\u{1F355}",
      dimensions: { spiceTolerance: -0.6, cuisinePreference: -0.3 },
    },
    optionB: {
      label: "Buffalo chicken pizza",
      subtitle: "Tangy hot sauce kick",
      emoji: "\u{1F525}",
      dimensions: { spiceTolerance: 0.6, proteinPreference: 0.4 },
    },
  },
  {
    id: 3,
    primaryDimension: "spiceTolerance",
    optionA: {
      label: "Creamy mushroom risotto",
      subtitle: "Earthy and comforting",
      emoji: "\u{1F344}",
      dimensions: { spiceTolerance: -0.7, flavorProfile: 0.5, dietaryLeaning: -0.2 },
    },
    optionB: {
      label: "Jerk chicken with habanero slaw",
      subtitle: "Caribbean heat",
      emoji: "\u{1F357}",
      dimensions: { spiceTolerance: 0.9, proteinPreference: 0.5 },
    },
  },

  // ── Meal Format (Q4–Q5) ───────────────────────────────────────────────────
  {
    id: 4,
    primaryDimension: "mealFormat",
    optionA: {
      label: "Build-your-own grain bowl",
      subtitle: "Rice, protein, toppings",
      emoji: "\u{1F963}",
      dimensions: { mealFormat: -0.8, dietaryLeaning: -0.3 },
    },
    optionB: {
      label: "A big composed entree plate",
      subtitle: "Chef's arrangement",
      emoji: "\u{1F37D}\u{FE0F}",
      dimensions: { mealFormat: 0.3, portionSize: 0.4 },
    },
  },
  {
    id: 5,
    primaryDimension: "mealFormat",
    optionA: {
      label: "Loaded salad with grilled chicken",
      subtitle: "Fresh and crunchy",
      emoji: "\u{1F957}",
      dimensions: { mealFormat: -0.5, dietaryLeaning: -0.5 },
    },
    optionB: {
      label: "Stacked club sandwich",
      subtitle: "Toasted with all the fixings",
      emoji: "\u{1F96A}",
      dimensions: { mealFormat: 0.8, portionSize: 0.3 },
    },
  },

  // ── Cuisine Preference (Q6–Q8) ────────────────────────────────────────────
  {
    id: 6,
    primaryDimension: "cuisinePreference",
    optionA: {
      label: "Chicken tikka masala",
      subtitle: "Warm Indian spices",
      emoji: "\u{1F35B}",
      dimensions: { cuisinePreference: 0.7, spiceTolerance: 0.3 },
    },
    optionB: {
      label: "Grilled salmon with lemon-dill",
      subtitle: "Clean and classic",
      emoji: "\u{1F41F}",
      dimensions: { cuisinePreference: -0.6, flavorProfile: -0.5 },
    },
  },
  {
    id: 7,
    primaryDimension: "cuisinePreference",
    optionA: {
      label: "Poke bowl with soy-marinated tuna",
      subtitle: "Hawaiian-Japanese fusion",
      emoji: "\u{1F363}",
      dimensions: { cuisinePreference: 0.6, cookingMethod: -0.6 },
    },
    optionB: {
      label: "Burrito bowl with carnitas",
      subtitle: "Slow-cooked Mexican flavors",
      emoji: "\u{1F32F}",
      dimensions: { cuisinePreference: 0.3, proteinPreference: 0.5, portionSize: 0.4 },
    },
  },
  {
    id: 8,
    primaryDimension: "cuisinePreference",
    optionA: {
      label: "Pad thai with shrimp",
      subtitle: "Sweet-savory noodles",
      emoji: "\u{1F35C}",
      dimensions: { cuisinePreference: 0.8, flavorProfile: 0.3 },
    },
    optionB: {
      label: "Pasta primavera",
      subtitle: "Italian garden vegetables",
      emoji: "\u{1F35D}",
      dimensions: { cuisinePreference: -0.5, dietaryLeaning: -0.3 },
    },
  },

  // ── Protein Preference (Q9–Q11) ───────────────────────────────────────────
  {
    id: 9,
    primaryDimension: "proteinPreference",
    optionA: {
      label: "Herb-grilled chicken breast",
      subtitle: "Lean and reliable",
      emoji: "\u{1F357}",
      dimensions: { proteinPreference: 0.4, cookingMethod: 0.3 },
    },
    optionB: {
      label: "Pan-seared salmon fillet",
      subtitle: "Omega-rich and buttery",
      emoji: "\u{1F41F}",
      dimensions: { proteinPreference: 0.2, flavorProfile: 0.2 },
    },
  },
  {
    id: 10,
    primaryDimension: "proteinPreference",
    optionA: {
      label: "Steak fajitas",
      subtitle: "Sizzling beef and peppers",
      emoji: "\u{1F969}",
      dimensions: { proteinPreference: 0.8, spiceTolerance: 0.3, portionSize: 0.4 },
    },
    optionB: {
      label: "Black bean burger",
      subtitle: "Hearty and plant-based",
      emoji: "\u{1F354}",
      dimensions: { proteinPreference: -0.8, dietaryLeaning: -0.4 },
    },
  },
  {
    id: 11,
    primaryDimension: "proteinPreference",
    optionA: {
      label: "Turkey club wrap",
      subtitle: "Light deli classic",
      emoji: "\u{1F32F}",
      dimensions: { proteinPreference: 0.3, portionSize: -0.3, mealFormat: 0.5 },
    },
    optionB: {
      label: "Shrimp tacos",
      subtitle: "Crispy and bright",
      emoji: "\u{1F32E}",
      dimensions: { proteinPreference: 0.1, cuisinePreference: 0.4 },
    },
  },

  // ── Cooking Method (Q12–Q13) ──────────────────────────────────────────────
  {
    id: 12,
    primaryDimension: "cookingMethod",
    optionA: {
      label: "Crispy fried chicken tenders",
      subtitle: "Golden and crunchy",
      emoji: "\u{1F357}",
      dimensions: { cookingMethod: 0.9, dietaryLeaning: 0.6 },
    },
    optionB: {
      label: "Herb-roasted chicken thigh",
      subtitle: "Oven-baked with herbs",
      emoji: "\u{1F33F}",
      dimensions: { cookingMethod: 0.3, dietaryLeaning: -0.2 },
    },
  },
  {
    id: 13,
    primaryDimension: "cookingMethod",
    optionA: {
      label: "Wood-fired grilled vegetables",
      subtitle: "Charred and smoky",
      emoji: "\u{1F966}",
      dimensions: { cookingMethod: 0.5, proteinPreference: -0.4, dietaryLeaning: -0.4 },
    },
    optionB: {
      label: "Fresh ceviche",
      subtitle: "Citrus-cured and raw",
      emoji: "\u{1F34B}",
      dimensions: { cookingMethod: -0.8, flavorProfile: -0.5 },
    },
  },

  // ── Portion Size (Q14–Q15) ────────────────────────────────────────────────
  {
    id: 14,
    primaryDimension: "portionSize",
    optionA: {
      label: "Light grain bowl",
      subtitle: "Clean and balanced",
      emoji: "\u{1F963}",
      dimensions: { portionSize: -0.8, dietaryLeaning: -0.5 },
    },
    optionB: {
      label: "Double smash burger",
      subtitle: "Go big or go home",
      emoji: "\u{1F354}",
      dimensions: { portionSize: 0.9, dietaryLeaning: 0.7 },
    },
  },
  {
    id: 15,
    primaryDimension: "portionSize",
    optionA: {
      label: "Hummus plate with veggies and pita",
      subtitle: "Snacky and shareable",
      emoji: "\u{1FAD3}",
      dimensions: { portionSize: -0.6, proteinPreference: -0.3, dietaryLeaning: -0.4 },
    },
    optionB: {
      label: "Full rack of BBQ ribs",
      subtitle: "All-in feast",
      emoji: "\u{1F356}",
      dimensions: { portionSize: 0.9, proteinPreference: 0.7, flavorProfile: 0.6 },
    },
  },

  // ── Flavor Profile (Q16–Q18) ──────────────────────────────────────────────
  {
    id: 16,
    primaryDimension: "flavorProfile",
    optionA: {
      label: "Teriyaki glazed salmon",
      subtitle: "Sweet and savory",
      emoji: "\u{1F41F}",
      dimensions: { flavorProfile: 0.5, cuisinePreference: 0.4 },
    },
    optionB: {
      label: "Chimichurri grilled steak",
      subtitle: "Herbaceous and bright",
      emoji: "\u{1F969}",
      dimensions: { flavorProfile: -0.5, proteinPreference: 0.5 },
    },
  },
  {
    id: 17,
    primaryDimension: "flavorProfile",
    optionA: {
      label: "BBQ pulled pork sandwich",
      subtitle: "Smoky and sweet",
      emoji: "\u{1F356}",
      dimensions: { flavorProfile: 0.7, portionSize: 0.4, dietaryLeaning: 0.5 },
    },
    optionB: {
      label: "Lemon-herb grilled fish",
      subtitle: "Clean and citrusy",
      emoji: "\u{1F41F}",
      dimensions: { flavorProfile: -0.7, dietaryLeaning: -0.4 },
    },
  },
  {
    id: 18,
    primaryDimension: "flavorProfile",
    optionA: {
      label: "Miso-glazed eggplant",
      subtitle: "Deep umami richness",
      emoji: "\u{1F346}",
      dimensions: { flavorProfile: 0.4, cuisinePreference: 0.5, proteinPreference: -0.5 },
    },
    optionB: {
      label: "Greek salad with grilled chicken",
      subtitle: "Fresh and tangy",
      emoji: "\u{1F957}",
      dimensions: { flavorProfile: -0.6, dietaryLeaning: -0.4 },
    },
  },

  // ── Dietary Leaning (Q19–Q20) ─────────────────────────────────────────────
  {
    id: 19,
    primaryDimension: "dietaryLeaning",
    optionA: {
      label: "Loaded nachos with extra cheese",
      subtitle: "Indulgent comfort food",
      emoji: "\u{1F9C0}",
      dimensions: { dietaryLeaning: 0.8, portionSize: 0.5, flavorProfile: 0.5 },
    },
    optionB: {
      label: "Mediterranean mezze plate",
      subtitle: "Olives, hummus, tabbouleh",
      emoji: "\u{1FAD2}",
      dimensions: { dietaryLeaning: -0.7, portionSize: -0.3, flavorProfile: -0.3 },
    },
  },
  {
    id: 20,
    primaryDimension: "dietaryLeaning",
    optionA: {
      label: "Acai bowl with granola",
      subtitle: "Light and fruity",
      emoji: "\u{1FAD0}",
      dimensions: { dietaryLeaning: -0.8, portionSize: -0.5, cookingMethod: -0.4 },
    },
    optionB: {
      label: "Eggs benedict with hollandaise",
      subtitle: "Brunch indulgence",
      emoji: "\u{1F373}",
      dimensions: { dietaryLeaning: 0.6, flavorProfile: 0.5, cookingMethod: 0.3 },
    },
  },
];
