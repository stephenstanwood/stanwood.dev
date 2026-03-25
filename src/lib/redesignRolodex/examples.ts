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
  "teenage.engineering",
  "ableton.com",
];

export function pickExamples(n: number): string[] {
  const shuffled = [...EXAMPLE_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
