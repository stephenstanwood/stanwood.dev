import type { APIRoute } from "astro";
import {
  buildFallbackSchedule,
  parseScheduleFromHtml,
  type BigInningSchedule,
} from "../../lib/bigInning";

export const prerender = false;

const MLB_URL =
  "https://support.mlb.com/s/article/What-Is-MLB-Big-Inning?language=en_US";

async function fetchAndParse(): Promise<BigInningSchedule | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(MLB_URL, {
      headers: {
        "User-Agent": "stanwood.dev (+https://stanwood.dev)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return parseScheduleFromHtml(await res.text());
  } catch {
    return null;
  }
}

export const GET: APIRoute = async () => {
  const scraped = await fetchAndParse();
  const schedule = scraped ?? buildFallbackSchedule();
  return new Response(JSON.stringify(schedule), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
