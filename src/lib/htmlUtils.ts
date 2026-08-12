/**
 * Shared HTML escaping, entity decoding, and URL sanitising used by the server-rendered
 * sports widgets and the feed scrapers.
 */

const ESC_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape a value for safe HTML insertion. */
export function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c] ?? c);
}

/**
 * Serialize a value for embedding inside a `<script>` tag. JSON.stringify alone is not
 * enough: it leaves `<` untouched, so any string containing `</script>` (a YouTube video
 * title, a scraped event name) closes the tag early and turns the rest into live markup.
 * `<` parses back to `<`, so consumers see the same data.
 */
export function jsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const UNESC_MAP: Record<string, string> = {
  "&quot;": '"',
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&amp;": "&",
};

/**
 * Decode the named and numeric entities that show up in the feeds we scrape (YouTube RSS,
 * the MLB Big Inning schedule table). The named pass is a single scan rather than one
 * `.replace` per entity, so `&amp;lt;` in the source stays the literal text `&lt;` instead
 * of being decoded twice into `<`.
 */
export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([a-f0-9]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&(?:quot|apos|lt|gt|nbsp|amp);/g, (entity) => UNESC_MAP[entity] ?? entity);
}

/** Sanitise a URL — only allow http(s) protocol. */
export function escUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}
