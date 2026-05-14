import type { APIRoute } from "astro";
import {
  buildFallbackSchedule,
  parseScheduleFromHtml,
  type BigInningSchedule,
} from "../../lib/bigInning";
import { fetchWithTimeout, okJson } from "../../lib/apiHelpers";

export const prerender = false;

const MLB_URL =
  "https://support.mlb.com/s/article/What-Is-MLB-Big-Inning?language=en_US";

async function fetchAndParse(): Promise<BigInningSchedule | null> {
  try {
    const res = await fetchWithTimeout(
      MLB_URL,
      {
        headers: {
          "User-Agent": "stanwood.dev (+https://stanwood.dev)",
          Accept: "text/html,application/xhtml+xml",
        },
      },
      5000,
    );
    if (!res.ok) return null;
    return parseScheduleFromHtml(await res.text());
  } catch {
    return null;
  }
}

export const GET: APIRoute = async () => {
  const scraped = await fetchAndParse();
  const schedule = scraped ?? buildFallbackSchedule();
  return okJson(schedule, {
    "Cache-Control":
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  });
};
