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

const CONCEPT_HTML_RULES = `
## conceptHtml rules (CRITICAL — read carefully)

Each conceptHtml is a self-contained HTML string rendered in a 400×280 iframe. It must:

1. Start with a complete HTML document: \`<!DOCTYPE html><html><head>...</head><body>...</body></html>\`
2. Include a Google Fonts \`<link>\` in the \`<head>\` for the fonts you chose
3. Set \`<body style="margin:0; overflow:hidden; width:400px; height:280px;">\`
4. Use ONLY inline styles — no \`<style>\` blocks, no classes, no external CSS
5. NO JavaScript whatsoever
6. Stay under 2000 characters total

Visual quality requirements:
- This is a HERO SECTION mockup — it should look like the top of a real website
- Include a headline (4-8 words related to the site's purpose), a short subline, and at least one button or visual element
- Use the exact palette colors you specified
- Use the exact Google Fonts you specified in fontDirection
- Make the layout feel intentional: consider alignment, spacing, visual hierarchy
- Each concept must look RADICALLY DIFFERENT from the others — vary layout (centered vs left-aligned vs asymmetric vs grid), density (spacious vs dense), contrast, type scale, and decorative elements
- Use CSS techniques like: borders, box-shadows, letter-spacing, text-transform, gradients, border-radius, flexbox, relative positioning
- Add visual interest: decorative borders, geometric shapes (via divs with backgrounds), accent bars, numbered sections, subtle patterns via repeated borders

Common mistakes to avoid:
- Don't make all 8 concepts look like centered-text-on-solid-background — vary the LAYOUT
- Don't use tiny text — headlines should be 28-48px
- Don't leave large empty areas — fill the 400×280 viewport intentionally
- Don't forget to set font-family on text elements`;

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
   - Radically different from EACH OTHER — no two should share the same design family
   - Not just palette swaps — different layout philosophies, typographic families, densities, moods
   - Each drawn from a DIFFERENT design family. Use at least 5 of these families across the 8:
     editorial, brutalist, luxe/premium, retro-tech, analog/tactile, cinematic dark mode,
     museum/cultural, soft organic, ultra-minimal, Y2K revival, old web prestige,
     experimental dashboard, poster-like, consumer brand, civic/institutional, playful/storybook,
     Japanese minimal, Swiss typographic, neon arcade, quiet luxury

For each direction, provide:
- **name**: A memorable 2-4 word direction name (e.g. "Swiss Editorial", "Neon Arcade Dashboard", "Quiet Japanese Minimal")
- **tagline**: One punchy sentence capturing the vibe
- **palette**: Array of exactly 5 hex colors: [background, primary text, secondary/muted, accent, surface/card]
- **fontDirection**: Specific Google Fonts to use (e.g. "Inter for body, Playfair Display for headings")
- **layoutNotes**: How the layout differs from the original (density, alignment, grid, whitespace)
- **artDirection**: Image/illustration style guidance
- **conceptHtml**: A self-contained HTML string — see rules below

${CONCEPT_HTML_RULES}

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
- Each new direction must come from a DIFFERENT design family than all previous ones
- Move into genuinely NEW visual territory
- Maximize distinctiveness across the full set

## Modifier:
${modifierGuidance}

## Generate 5 new directions

For each direction, provide:
- name, tagline, palette (5 hex: [background, primary text, secondary, accent, surface]), fontDirection, layoutNotes, artDirection, conceptHtml

${CONCEPT_HTML_RULES}

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
