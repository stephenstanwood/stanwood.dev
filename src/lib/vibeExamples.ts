/** Eclectic pool of sites for Vibe Check "try:" suggestions */
const ALL_EXAMPLES = [
  // design-forward
  "apple.com",
  "stripe.com",
  "linear.app",
  "figma.com",
  "vercel.com",
  "arc.net",
  "craft.do",
  "raycast.com",
  "framer.com",
  "supabase.com",
  "resend.com",
  "cal.com",
  // indie / creative
  "poolsuite.net",
  "neal.fun",
  "bruno-simon.com",
  "lottiefiles.com",
  "magicpattern.design",
  "pika.style",
  "uiball.com",
  "hypercolor.dev",
  // retro / weird / iconic
  "spacejam.com",
  "berkshirehathaway.com",
  "craigslist.org",
  "motherfuckingwebsite.com",
  "lingscars.com",
  "zombo.com",
  "theuselessweb.com",
  "cameronsworld.net",
  // tools builders use
  "notion.so",
  "fly.io",
  "deno.com",
  "railway.app",
  "coolors.co",
  "excalidraw.com",
  "tldraw.com",
  "replit.com",
  // media / culture
  "wikipedia.org",
  "are.na",
  "readcv.com",
  "layers.to",
  "dribbble.com",
  "behance.net",
  // government / institutional
  "gov.uk",
  "nasa.gov",
  // personal sites / portfolios
  "stanwood.dev",
  "joshwcomeau.com",
  "leerob.io",
  "cassidoo.co",
  "rauno.me",
];

export function pickExamples(n: number): string[] {
  const shuffled = [...ALL_EXAMPLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
