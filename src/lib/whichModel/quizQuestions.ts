import type { QuizQuestion } from "./types";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: "What matters more to you?",
    optionA: {
      label: "Quality",
      emoji: "💎",
      weights: { reasoning: 8, writing: 6 },
    },
    optionB: {
      label: "Speed",
      emoji: "⚡",
      weights: { speed: 9, cost: 5 },
    },
  },
  {
    id: 2,
    prompt: "What kind of work?",
    optionA: {
      label: "Writing & creative",
      emoji: "✍️",
      weights: { writing: 9, reasoning: 4 },
    },
    optionB: {
      label: "Code & technical",
      emoji: "💻",
      weights: { coding: 9, reasoning: 5 },
    },
  },
  {
    id: 3,
    prompt: "Do you need images?",
    optionA: {
      label: "Yes, generate or analyze",
      emoji: "🖼️",
      weights: { image_gen: 7, image_understanding: 7, multimodal: 5 },
    },
    optionB: {
      label: "Nope, text is fine",
      emoji: "📝",
      weights: { writing: 3, reasoning: 3, coding: 2 },
    },
  },
  {
    id: 4,
    prompt: "How are you using it?",
    optionA: {
      label: "Building a product",
      emoji: "🔧",
      weights: { ecosystem: 8, speed: 3, coding: 3 },
    },
    optionB: {
      label: "Personal / exploring",
      emoji: "🧪",
      weights: { cost: 6, open_source: 4, reasoning: 3 },
    },
  },
  {
    id: 5,
    prompt: "How much are you throwing at it?",
    optionA: {
      label: "Huge docs, long chats",
      emoji: "📚",
      weights: { long_context: 9, reasoning: 4 },
    },
    optionB: {
      label: "Quick, short tasks",
      emoji: "🏃",
      weights: { speed: 7, cost: 5 },
    },
  },
];
