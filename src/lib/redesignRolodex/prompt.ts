import type { WeirdnessMode } from "./types";

const MODE_GUIDANCE: Record<WeirdnessMode, string> = {
  "client-safe": `Mode: Client-safe.
Generate redesigns that stay grounded in plausible, polished modern design.
They should still be meaningfully different from each other and the source,
but feel like something you could pitch to a real client. Think: professional,
refined, usable — but with a clear new identity each time.`,

  designer: `Mode: Designer mode.
Take broader aesthetic swings. Be more expressive, daring, and opinionated.
Push typography, color, and layout choices further than what's "safe."
Each direction should feel like a designer's personal portfolio piece —
striking and intentional, occasionally surprising.`,

  "alternate-timeline": `Mode: Alternate timeline.
Go genuinely weird, surprising, playful, and aggressively stylistic.
Think "what if this website existed in a different universe?" Drift into
unexpected aesthetics: retro-futurism, brutalist, cinematic, analog,
experimental, post-internet, Y2K. Still recognizable as a redesign
of the same site, but radically different in feel.`,
};

export function buildAnalyzePrompt(url: string, mode: WeirdnessMode): string {
  return `You are an expert design director generating radically different redesign directions for a website.

You will receive a screenshot of the website at ${url}.

${MODE_GUIDANCE[mode]}

## Your task

1. **Analyze** the current site:
   - What type of site is this? (SaaS, portfolio, e-commerce, tool, marketing, etc.)
   - What is its current aesthetic? (e.g. "clean SaaS with generous whitespace and blue accents")
   - What's the font vibe? (e.g. "geometric sans-serif, modern and neutral")
   - What's the color vibe? (e.g. "corporate blue with white backgrounds")
   - Give it a short tone tag (e.g. "polished corporate", "indie playful", "functional but dated")
   - Extract the page title and a short description

2. **Generate exactly 8 redesign directions** that are:
   - Radically different from the source site
   - Radically different from EACH OTHER
   - Not just palette swaps — different layout philosophies, typographic families, densities, moods
   - Drawn from diverse design families: editorial, brutalist, luxe, retro-tech, analog/tactile, cinematic, museum/cultural, soft organic, ultra-minimal, Y2K, old web revival, experimental dashboard, poster-like, premium consumer brand, offbeat civic UI, playful, storybook, etc.

For each direction, provide:
- **name**: A memorable 2-4 word direction name (e.g. "Swiss Editorial", "Neon Arcade Dashboard", "Quiet Japanese Minimal")
- **tagline**: One sentence capturing the vibe
- **palette**: Array of exactly 5 hex colors (background, primary, secondary, accent, text)
- **fontDirection**: What fonts/typographic approach to use (reference specific Google Fonts)
- **layoutNotes**: How the layout differs from the original (density, alignment, grid, whitespace)
- **artDirection**: Image/illustration style guidance
- **conceptHtml**: A self-contained HTML string (under 2000 chars) that renders a ~400x280 mini hero concept. Requirements:
  - Include a Google Fonts \`<link>\` tag in the HTML for the fonts you specified
  - Use only inline styles (no external CSS)
  - Create a visually compelling mini hero section that communicates the redesign direction
  - Include placeholder headline text that fits the site's purpose
  - Show the layout, typography, colors, and spacing clearly
  - The HTML should render beautifully at 400x280px
  - Do NOT use JavaScript
  - Make each concept visually VERY different from the others

## Response format

Return valid JSON only (no markdown fences, no commentary):

{
  "siteAnalysis": {
    "siteType": "...",
    "currentAesthetic": "...",
    "fontVibe": "...",
    "colorVibe": "...",
    "toneTag": "...",
    "title": "...",
    "description": "..."
  },
  "directions": [
    {
      "name": "...",
      "tagline": "...",
      "palette": ["#...", "#...", "#...", "#...", "#..."],
      "fontDirection": "...",
      "layoutNotes": "...",
      "artDirection": "...",
      "conceptHtml": "..."
    }
  ]
}`;
}

export function buildMorePrompt(
  url: string,
  mode: WeirdnessMode,
  modifier: "more" | "weirder" | "calmer",
  previousNames: string[],
): string {
  const modifierGuidance =
    modifier === "weirder"
      ? "Push EVEN FURTHER into unexpected, wild, experimental territory. Be more daring than the previous batch."
      : modifier === "calmer"
        ? "Pull back slightly toward more grounded, usable territory — but still generate distinctly different directions."
        : "Generate a fresh set of directions with similar range to before.";

  return `You are an expert design director generating MORE redesign directions for a website.

The website is: ${url}

${MODE_GUIDANCE[mode]}

## Previous directions already generated (DO NOT REPEAT):
${previousNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}

## Anti-duplication rules (CRITICAL):
- Do NOT repeat any of the above directions or their close variants
- Do NOT generate near-duplicates (e.g. "Swiss Editorial" and "Swiss Typographic" are too similar)
- Do NOT just do color rotations of previous directions
- Move into genuinely NEW visual territory
- Maximize distinctiveness across the full set

## Modifier:
${modifierGuidance}

## Generate 5 new directions

For each direction, provide the same structure:
- name, tagline, palette (5 hex), fontDirection, layoutNotes, artDirection, conceptHtml

The conceptHtml should be a self-contained HTML string (under 2000 chars) rendering a ~400x280 mini hero concept with:
- Google Fonts \`<link>\` tag
- Only inline styles
- Visually compelling hero section
- Placeholder headline text fitting the site's purpose
- No JavaScript

Return valid JSON only:

{
  "directions": [
    {
      "name": "...",
      "tagline": "...",
      "palette": ["#...", "#...", "#...", "#...", "#..."],
      "fontDirection": "...",
      "layoutNotes": "...",
      "artDirection": "...",
      "conceptHtml": "..."
    }
  ]
}`;
}
