const EXAMPLE_URLS = [
  "apple.com",
  "patagonia.com",
  "airbnb.com",
  "spotify.com",
  "are.na",
  "poolside.ai",
  "teenage.engineering",
  "cosmos.so",
  "read.cv",
  "amie.so",
  "perplexity.ai",
  "monzo.com",
  "nothing.tech",
  "daylight.computer",
  "once.com",
  "bearblog.dev",
  "godly.website",
  "ableton.com",
  "rolecatcher.com",
  "layers.to",
];

export function pickExamples(n: number): string[] {
  const shuffled = [...EXAMPLE_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
