/**
 * Turns each club's raw class labels into clean names plus tags.
 * Fee, prerequisite and booking marks come only from the club's own text.
 */

import type { ClassTag } from "./types";

const EMOJI = /\p{Extended_Pictographic}️?/gu;
const EDGE_PUNCTUATION = /^[\s:|\-–—]+|[\s:|\-–—]+$/g;

function squish(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function sentenceCase(text: string): string {
  const lower = squish(text).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function addTag(tags: ClassTag[], tag: ClassTag): void {
  if (!tags.some((t) => t.kind === tag.kind)) tags.push(tag);
}

/** "SARAH MCGRATH" → "Sarah McGrath". Mixed-case names are already right and stay as given. */
export function displayName(raw: string | null | undefined): string | null {
  const name = squish(raw ?? "");
  if (!name) return null;
  if (name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, lead: string, letter: string) => lead + letter.toUpperCase())
    .replace(/\bMc(\p{L})/gu, (_, letter: string) => `Mc${letter.toUpperCase()}`);
}

/**
 * Bay Club titles carry "$" for an extra charge and "BOOKING REQUIRED" for reserve-ahead
 * classes, e.g. "Pilates Reformer | Mixed Level $" or "Cycle: BOOKING REQUIRED ".
 */
export function cleanCourtsideTitle(raw: string): { title: string; tags: ClassTag[] } {
  const tags: ClassTag[] = [];
  let title = squish(raw);
  if (title.includes("$")) {
    addTag(tags, { kind: "fee", label: "Extra fee" });
    title = title.replace(/\$/g, " ");
  }
  if (/booking required/i.test(title)) {
    addTag(tags, { kind: "booking", label: "Booking required" });
    title = title.replace(/booking required/gi, " ");
  }
  title = title
    .replace(/[™®©]/g, "")
    .replace(/\s*\|\s*/g, ": ")
    .replace(/\s+-\s+/g, ": ");
  title = squish(title).replace(EDGE_PUNCTUATION, "");
  return { title, tags };
}

/**
 * Mindbody names at Club LG mix decoration into the name, e.g. "Hot Barre Fusion (heated) 🔥🔥",
 * "Barbell WOD *Elements Required*", "… Pop Up- A COMPLIMENTARY Trial!".
 */
export function cleanClubLgName(raw: string, room: string | null): { title: string; tags: ClassTag[] } {
  const tags: ClassTag[] = [];
  const heated = /🔥|\(heated\)|\bheated\b/i.test(raw) || /heated/i.test(room ?? "");
  let title = squish(raw.replace(EMOJI, " "));

  title = title.replace(/\*([^*]+)\*/g, (_, aside: string) => {
    addTag(tags, { kind: "prereq", label: sentenceCase(aside) });
    return " ";
  });
  if (heated) {
    addTag(tags, { kind: "heated", label: "Heated" });
    title = title.replace(/\s*\(heated\)\s*/gi, " ");
  }
  // "Body Shop- Total Body Burner" → "Body Shop: Total Body Burner"
  title = squish(title.replace(/(\S)-\s+/g, "$1: "));

  if (/pop[\s-]?up/i.test(title)) addTag(tags, { kind: "popup", label: "Pop-up" });
  if (/complimentary|\bfree\b/i.test(title)) {
    addTag(tags, { kind: "free", label: "Free" });
    // The tag says it; drop a trailing "…: A COMPLIMENTARY Trial!" clause.
    title = title.replace(/:\s*[^:]*\bcomplimentary\b[^:]*$/i, "");
  }
  title = squish(title).replace(EDGE_PUNCTUATION, "");
  return { title, tags };
}

/** Kids' programs, team practices, private sessions and open play aren't classes for this chart. */
const NOT_A_CLASS =
  /\b(kids?|youth|junior|jr\.?|teens?|tots?|toddlers?|child(ren)?|camps?|swim team|panthers|private|personal training|appointment|open (gym|play|swim))\b/i;

export function isAdultGroupClass(title: string, category = ""): boolean {
  if (/^safety$/i.test(category.trim())) return false;
  return !NOT_A_CLASS.test(title) && !NOT_A_CLASS.test(category);
}
