import type { SiteAnalysis, DesignDirection, WeirdnessMode } from "./types";

const MODE_LABELS: Record<WeirdnessMode, string> = {
  "client-safe": "Client-safe",
  designer: "Designer mode",
  "alternate-timeline": "Alternate timeline",
};

export function buildCopyPrompt(
  url: string,
  analysis: SiteAnalysis,
  direction: DesignDirection,
  mode: WeirdnessMode,
): string {
  return `Redesign this website based on the following source: ${url}

Current site summary:
${analysis.siteType}. ${analysis.currentAesthetic}.
Font vibe: ${analysis.fontVibe}. Color vibe: ${analysis.colorVibe}. Tone: ${analysis.toneTag}.

Create a radically different redesign direction called "${direction.name}."

Mode: ${MODE_LABELS[mode]}

Aesthetic goal:
${direction.tagline}

Typography: ${direction.fontDirection}
Palette: ${direction.palette.join(", ")}
Layout: ${direction.layoutNotes}
Art direction: ${direction.artDirection}

Keep the site's core purpose and content structure recognizable, but fully rethink:
- typography
- colors
- spacing and density
- component styling
- visual hierarchy
- imagery and art direction
- motion and hover behavior

Build a cohesive, production-quality front-end concept that feels complete, stylish, and intentional — not just a skin.`;
}
