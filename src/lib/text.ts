/** Shared string helpers. */

/**
 * Pick the singular or plural noun for `count` — `pluralize(3, "day")` → "days".
 * Pass an explicit plural for irregular forms: `pluralize(2, "crush", "crushes")`.
 */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
