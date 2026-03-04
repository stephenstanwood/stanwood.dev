import type { APIRoute } from "astro";

/**
 * Lightweight weather proxy for the homepage terminal card.
 * Fetches current conditions from wttr.in for Campbell, CA
 * and returns a one-liner like "☀️  72°F clear".
 *
 * Cached for 30 minutes via CDN headers.
 */
export const GET: APIRoute = async () => {
  try {
    // wttr.in format: %c = weather icon, %t = temperature, %C = condition text
    const res = await fetch("https://wttr.in/Campbell,CA?format=%c+%t+%C", {
      headers: { "User-Agent": "stanwood.dev terminal card" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error(`wttr.in ${res.status}`);

    const raw = await res.text();
    // Clean up: wttr.in sometimes adds extra whitespace
    const line = raw.trim().replace(/\s+/g, " ");

    return new Response(JSON.stringify({ weather: line }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=1800, max-age=900",
      },
    });
  } catch {
    return new Response(JSON.stringify({ weather: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
