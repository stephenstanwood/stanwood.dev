/**
 * Shared HTML/XSS utilities used by MLB GameRank and NBA Now renderers.
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

/** Sanitise a URL — only allow http(s) protocol. */
export function escUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}
