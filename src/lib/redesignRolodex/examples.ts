const EXAMPLE_URLS = [
  "stripe.com",
  "linear.app",
  "notion.so",
  "vercel.com",
  "arc.net",
  "figma.com",
  "superhuman.com",
  "resend.com",
  "cal.com",
  "tailwindcss.com",
  "supabase.com",
  "planetscale.com",
  "fly.io",
  "raycast.com",
  "craft.do",
  "loom.com",
  "pitch.com",
  "framer.com",
  "dub.co",
  "clerk.com",
];

export function pickExamples(n: number): string[] {
  const shuffled = [...EXAMPLE_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
