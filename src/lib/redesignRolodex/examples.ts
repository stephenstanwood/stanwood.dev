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

export function pickExamples(n: number): string[] {
  return shuffle(EXAMPLE_URLS).slice(0, n);
}
