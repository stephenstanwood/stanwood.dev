/**
 * Turn arbitrary text into a URL/DOM-safe slug: lowercase, non-alphanumeric
 * runs collapsed to single hyphens, no leading/trailing hyphens. Pass
 * `maxLength` to cap the result (used for download filenames).
 */
export function slugify(text: string, maxLength?: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return maxLength ? slug.slice(0, maxLength) : slug;
}
