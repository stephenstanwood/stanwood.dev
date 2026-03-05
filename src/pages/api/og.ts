export const prerender = false;

import type { APIRoute } from "astro";
import { ImageResponse } from "@vercel/og";

/**
 * Dynamic Open Graph image generator.
 * Usage: /api/og?page=mlb-gamerank → returns a 1200×630 PNG.
 *
 * Each page has a pre-defined config (emoji, title, description, colors)
 * so URLs stay clean and can't be abused to render arbitrary content.
 */

interface PageConfig {
  emoji: string;
  title: string;
  tagline: string;
  bg: string;       // gradient start (darker)
  bg2: string;      // gradient end (lighter)
  accent: string;   // accent color for emoji glow / border
}

const PAGES: Record<string, PageConfig> = {
  index: {
    emoji: "🛠️",
    title: "stanwood.dev",
    tagline: "Projects I'm tinkering with.",
    bg: "#0f0c29",
    bg2: "#1a1545",
    accent: "#818cf8",
  },
  "pixel-aquarium": {
    emoji: "🐠",
    title: "Pixel Aquarium",
    tagline: "Little pixel fish swim around. Click to drop food.",
    bg: "#0a1628",
    bg2: "#0f2847",
    accent: "#38bdf8",
  },
  "pixel-tide": {
    emoji: "🌊",
    title: "Pixel Tide",
    tagline: "Waves wash in and out. Click to build sandcastles.",
    bg: "#1a1c2e",
    bg2: "#2a2d4a",
    accent: "#818cf8",
  },
  "green-light": {
    emoji: "🟢",
    title: "Green Light",
    tagline: "Know what to order before you sit down.",
    bg: "#0a0f0a",
    bg2: "#142814",
    accent: "#4ade80",
  },
  "nba-now": {
    emoji: "🏀",
    title: "NBA Now",
    tagline: "The best NBA game to watch right now.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#f97316",
  },
  tldr: {
    emoji: "📄",
    title: "TL;DR",
    tagline: "Tell me what this long PDF says.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#a78bfa",
  },
  wtwtw: {
    emoji: "📺",
    title: "WTWTW",
    tagline: "What To Watch This Week — best game each night.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#fb923c",
  },
  "idea-shuffler": {
    emoji: "🔀",
    title: "Idea Shuffler",
    tagline: "Browse ideas without ranking them.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#f472b6",
  },
  swim: {
    emoji: "🏊",
    title: "Lap Lab",
    tagline: "Generate custom swim workouts for any duration and pace.",
    bg: "#0f172a",
    bg2: "#1e293b",
    accent: "#38bdf8",
  },
  "mlb-gamerank": {
    emoji: "⚾",
    title: "MLB GameRank",
    tagline: "The best MLB game to watch right now.",
    bg: "#14532d",
    bg2: "#1a5c30",
    accent: "#fbbf24",
  },
  "nearest-coffee": {
    emoji: "☕",
    title: "Nearest Coffee",
    tagline: "Find the nearest coffee shop open right now.",
    bg: "#0e1110",
    bg2: "#1a2420",
    accent: "#a3e635",
  },
  "nearest-fun": {
    emoji: "🎪",
    title: "FunFinder",
    tagline: "Find kids activities open right now near you.",
    bg: "#111318",
    bg2: "#1e2330",
    accent: "#c084fc",
  },
  "show-swipe": {
    emoji: "🍿",
    title: "Show Swipe",
    tagline: "Swipe through movie and TV trailers.",
    bg: "#0d0d0d",
    bg2: "#1a1010",
    accent: "#e85d4a",
  },
};

export const GET: APIRoute = async ({ url }) => {
  const page = url.searchParams.get("page") ?? "index";
  const config = PAGES[page];

  if (!config) {
    return new Response("Unknown page", { status: 404 });
  }

  const html = {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(135deg, ${config.bg} 0%, ${config.bg2} 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
      },
      children: [
        // Subtle grid pattern overlay
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 1px 1px, ${config.accent}11 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            },
          },
        },
        // Accent glow behind emoji
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "180px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${config.accent}25 0%, transparent 70%)`,
              filter: "blur(40px)",
            },
          },
        },
        // Emoji
        {
          type: "div",
          props: {
            style: {
              fontSize: "96px",
              lineHeight: "1",
              marginBottom: "24px",
            },
            children: config.emoji,
          },
        },
        // Title
        {
          type: "div",
          props: {
            style: {
              fontSize: "56px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              textAlign: "center",
              maxWidth: "900px",
              padding: "0 40px",
            },
            children: config.title,
          },
        },
        // Tagline
        {
          type: "div",
          props: {
            style: {
              fontSize: "24px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.6)",
              marginTop: "16px",
              textAlign: "center",
              maxWidth: "700px",
              padding: "0 40px",
              lineHeight: "1.4",
            },
            children: config.tagline,
          },
        },
        // Bottom bar: accent line + domain
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "40px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "32px",
                    height: "3px",
                    borderRadius: "2px",
                    background: config.accent,
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.4)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  },
                  children: "stanwood.dev",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: "32px",
                    height: "3px",
                    borderRadius: "2px",
                    background: config.accent,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  // Plain object trees are valid at runtime (Satori accepts them)
  // but @vercel/og types expect ReactElement, hence the cast.
  return new ImageResponse(html as unknown as React.ReactElement, {
    width: 1200,
    height: 630,
  });
};
