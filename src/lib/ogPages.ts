/**
 * Static page config for OG image generation.
 * Separated from the handler so it's easy to maintain.
 */

export interface PageConfig {
  emoji: string;
  title: string;
  tagline: string;
  bg: string;       // gradient start (darker)
  bg2: string;      // gradient end (lighter)
  accent: string;   // accent color for emoji glow / border
}

export const PAGES: Record<string, PageConfig> = {
  index: {
    emoji: "",
    title: "Stephen Stanwood",
    tagline: "Builder, designer, developer. Apps, games & experiments.",
    bg: "#f5df4d",
    bg2: "#f0d400",
    accent: "#111",
  },
  about: {
    emoji: "\u{1F44B}",
    title: "About Stephen Stanwood",
    tagline: "Builder and designer. Campbell, California.",
    bg: "#f5df4d",
    bg2: "#f0d400",
    accent: "#111",
  },
  "pixel-aquarium": {
    emoji: "\u{1F420}",
    title: "Pixel Aquarium",
    tagline: "Little pixel fish swim around. Click to drop food.",
    bg: "#0a1628",
    bg2: "#0f2847",
    accent: "#38bdf8",
  },
  "pixel-tide": {
    emoji: "\u{1F30A}",
    title: "Pixel Tide",
    tagline: "Waves wash in and out. Click to build sandcastles.",
    bg: "#1a1c2e",
    bg2: "#2a2d4a",
    accent: "#818cf8",
  },
  "green-light": {
    emoji: "\u{1F7E2}",
    title: "Green Light",
    tagline: "Know what to order before you sit down.",
    bg: "#0a0f0a",
    bg2: "#142814",
    accent: "#4ade80",
  },
  "nba-now": {
    emoji: "\u{1F3C0}",
    title: "NBA Now",
    tagline: "The best NBA game to watch right now.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#f97316",
  },
  tldr: {
    emoji: "\u{1F4C4}",
    title: "TL;DR",
    tagline: "Tell me what this long PDF says.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#a78bfa",
  },
  wtwtw: {
    emoji: "\u{1F4FA}",
    title: "WTWTW",
    tagline: "What To Watch This Week \u2014 best game each night.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#fb923c",
  },
  "idea-shuffler": {
    emoji: "\u{1F500}",
    title: "Idea Shuffler",
    tagline: "Browse ideas without ranking them.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#f472b6",
  },
  swim: {
    emoji: "\u{1F3CA}",
    title: "Lap Lab",
    tagline: "Generate custom swim workouts for any duration and pace.",
    bg: "#0f172a",
    bg2: "#1e293b",
    accent: "#38bdf8",
  },
  "mlb-gamerank": {
    emoji: "\u26BE",
    title: "MLB GameRank",
    tagline: "The best MLB game to watch right now.",
    bg: "#14532d",
    bg2: "#1a5c30",
    accent: "#fbbf24",
  },
  "nearest-coffee": {
    emoji: "\u2615",
    title: "Nearest Coffee",
    tagline: "Find the nearest coffee shop open right now.",
    bg: "#0e1110",
    bg2: "#1a2420",
    accent: "#a3e635",
  },
  "kid-window": {
    emoji: "\u{1FA9F}",
    title: "Kid Window",
    tagline: "Find kids activities open right now near you.",
    bg: "#1a1545",
    bg2: "#0f0c29",
    accent: "#f5e642",
  },
  "show-swipe": {
    emoji: "\u{1F37F}",
    title: "Show Swipe",
    tagline: "Swipe through movie and TV trailers.",
    bg: "#0d0d0d",
    bg2: "#1a1010",
    accent: "#e85d4a",
  },
  "redesign-rolodex": {
    emoji: "\u{1F3B0}",
    title: "Redesign Rolodex",
    tagline: "Paste a URL. Spin through alternate-universe redesigns.",
    bg: "#1C1030",
    bg2: "#2D1B4E",
    accent: "#A78BDB",
  },
  "vibe-check": {
    emoji: "\u2728",
    title: "Vibe Check",
    tagline: "Paste a URL, get an instant design vibe rating.",
    bg: "#0d0f1a",
    bg2: "#1a1f3a",
    accent: "#a78bfa",
  },
  "which-model": {
    emoji: "\u{1F9E0}",
    title: "Which Model?",
    tagline: "Match your task to the right AI model.",
    bg: "#0f1117",
    bg2: "#1a1f2e",
    accent: "#f472b6",
  },
  "ship-clock": {
    emoji: "\u{1F552}",
    title: "Ship Clock",
    tagline: "Days since the last deploy.",
    bg: "#0f0f0f",
    bg2: "#1a1a1a",
    accent: "#f5e642",
  },
  radar: {
    emoji: "\u{1F4E1}",
    title: "AI Radar",
    tagline: "Curated AI launches for builders who ship.",
    bg: "#0a0f1a",
    bg2: "#0f1828",
    accent: "#38bdf8",
  },
};
