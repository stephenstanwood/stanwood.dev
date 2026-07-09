// Proxy to WNBA's schedule API. The old static CDN path now serves a stale HTML
// shell, and WNBA.com only allows its own origin to call the live JSON endpoint
// from browsers, so this route mirrors the minimal { gameCode → gameId } map.

import type { APIRoute } from "astro";
import { errJson, fetchWithTimeout, okJson } from "../../lib/apiHelpers";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";

export const prerender = false;

function currentWnbaSeason(): string {
  return String(new Date().getUTCFullYear());
}

function wnbaScheduleUrl(season = currentWnbaSeason()): string {
  return `https://www.wnba.com/api/schedule?season=${season}&regionId=1`;
}

interface RawGame {
  gameId?: string;
  gameCode?: string;
}

interface RawSchedule {
  leagueSchedule?: {
    gameDates?: Array<{ games?: RawGame[] }>;
  };
}

export const GET: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();
  try {
    const res = await fetchWithTimeout(
      wnbaScheduleUrl(),
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "application/json",
        },
      },
      8000,
    );
    if (!res.ok) return errJson(`Upstream ${res.status}`, 502);
    const j: RawSchedule = await res.json();
    if (!Array.isArray(j.leagueSchedule?.gameDates)) {
      return errJson("Unexpected WNBA schedule response", 502);
    }
    const out: Record<string, string> = {};
    for (const day of j.leagueSchedule.gameDates) {
      for (const g of day.games || []) {
        if (g.gameCode && g.gameId) out[g.gameCode] = g.gameId;
      }
    }
    return okJson(out, {
      "Cache-Control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate=21600",
    });
  } catch (err) {
    console.error("wnba-schedule fetch failed:", err);
    return errJson("Failed to fetch WNBA schedule", 500);
  }
};
