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
  const shuffled = [...EXAMPLE_URLS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}
