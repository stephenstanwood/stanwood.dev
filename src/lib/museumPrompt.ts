export interface MuseumStyle {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const MUSEUM_STYLES: MuseumStyle[] = [
  {
    id: "classic",
    label: "Museum Classic",
    description: "Metropolitan Museum wall label — dignified, scholarly, restrained",
    emoji: "🏛️",
  },
  {
    id: "archaeology",
    label: "Archaeology",
    description: "Field catalog entry — precise, clinical, obsessed with provenance",
    emoji: "🏺",
  },
  {
    id: "modern-art",
    label: "Modern Art",
    description: "MoMA gallery card — pretentious, conceptual, deeply meaningful about nothing",
    emoji: "🎨",
  },
  {
    id: "over-serious",
    label: "Grandly Over-Serious",
    description: "As if this mundane object will reshape human civilization",
    emoji: "👑",
  },
  {
    id: "auction",
    label: "Tiny Auction Catalog",
    description: "Christie's lot description — provenance-obsessed, breathlessly valuable",
    emoji: "🔨",
  },
];

export function getSystemPrompt(styleId: string): string {
  const style = MUSEUM_STYLES.find((s) => s.id === styleId);
  if (!style) throw new Error(`Unknown style: ${styleId}`);

  const base = `You are a world-class museum curator writing a placard label for an everyday object shown in a photograph. Your job is to treat the object with absolute seriousness, as if it belongs in the world's finest museum collection. Be deadpan — never break character or acknowledge the humor.

Respond with ONLY a JSON object (no markdown, no code fences) with these fields:
- "title": The object's name, elevated to art-world grandeur (e.g., a fork becomes "Tined Implement for the Conveyance of Sustenance")
- "artist": An invented creator or civilization (e.g., "Unknown artisan, American Suburban School")
- "period": A plausible-sounding era or date range
- "materials": What the object appears to be made of, described with museum precision
- "dimensions": Estimated dimensions in museum format
- "description": 2-3 sentences of deadpan museum prose. This is the star of the label.
- "accession": A fake accession number in the format "2024.XXX.XX"`;

  const styleInstructions: Record<string, string> = {
    classic: `Style: Metropolitan Museum wall label. Dignified, scholarly, restrained. Reference art historical movements and techniques. The description should sound like it was written by someone with three PhDs and a profound respect for material culture.`,

    archaeology: `Style: Archaeological field catalog. Clinical, precise, obsessed with provenance and stratigraphy. Reference excavation contexts, cultural layers, and material analysis. Use phrases like "recovered from," "consistent with," and "further analysis pending." The description should read like a peer-reviewed journal entry about a dig site that happens to be someone's kitchen.`,

    "modern-art": `Style: MoMA gallery card. Pretentious, conceptual, deeply meaningful about nothing. Reference artistic movements (post-structuralism, neo-dadaism, etc.). The description should make the viewer feel intellectually inadequate for not understanding why a household object is a profound statement about the human condition. Use phrases like "interrogates the boundary between" and "challenges our assumptions about."`,

    "over-serious": `Style: Grandly over-serious. This object will reshape civilization. Write as if future historians will study this artifact to understand the rise and fall of empires. The description should have the gravitas of a keynote speech at Davos about a spatula. Use dramatic language, sweeping historical claims, and treat the object as if it holds the key to understanding humanity itself.`,

    auction: `Style: Christie's auction catalog lot description. Provenance-obsessed, breathlessly valuable. Reference previous collections, exhibitions, and published literature. Include condition notes. The description should make someone believe this object is worth mortgaging their house. Use phrases like "exceedingly rare," "from the distinguished collection of," and "museum-quality example."`,
  };

  return `${base}\n\n${styleInstructions[styleId] || styleInstructions.classic}`;
}

export interface MuseumLabel {
  title: string;
  artist: string;
  period: string;
  materials: string;
  dimensions: string;
  description: string;
  accession: string;
}
