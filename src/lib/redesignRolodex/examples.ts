import { shuffle } from "../arrays";

const EXAMPLE_URLS = [
  "apple.com",
  "spotify.com",
  "airbnb.com",
  "nike.com",
  "netflix.com",
  "stripe.com",
  "notion.so",
  "figma.com",
  "tesla.com",
  "duolingo.com",
  "patagonia.com",
  "starbucks.com",
  "nasa.gov",
  "ikea.com",
  "lego.com",
  "nintendo.com",
  "nytimes.com",
  "reddit.com",
  "wikipedia.org",
  "craigslist.org",
  "discord.com",
  "ableton.com",
];

/** Stable, non-random pick for server render / first paint (avoids hydration mismatch). */
export function defaultExamples(n: number): string[] {
  return EXAMPLE_URLS.slice(0, n);
}

export function pickExamples(n: number): string[] {
  return shuffle(EXAMPLE_URLS).slice(0, n);
}
