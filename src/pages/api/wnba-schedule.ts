// Proxy to the WNBA static schedule CDN. The CDN doesn't send CORS headers,
// so we can't fetch it directly from the browser — this route mirrors the
// payload back with our own CORS headers + caching, returning only the
// minimal { gameCode → gameId } map the client actually needs.

import type { APIRoute } from "astro";
import { errJson, fetchWithTimeout, okJson } from "../../lib/apiHelpers";

export const prerender = false;

const WNBA_SCHEDULE_URL =
  "https://cdn.wnba.com/static/json/staticData/scheduleLeagueV2.json";

interface RawGame {
  gameId?: string;
  gameCode?: string;
}

interface RawSchedule {
  leagueSchedule?: {
    gameDates?: Array<{ games?: RawGame[] }>;
  };
}

export const GET: APIRoute = async () => {
  try {
    // cdn.wnba.com returns HTTP/2 INTERNAL_ERROR for unknown User-Agents,
    // so we send a standard browser UA. Without this the upstream just
    // resets the stream.
    const res = await fetchWithTimeout(
      WNBA_SCHEDULE_URL,
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
    const out: Record<string, string> = {};
    for (const day of j.leagueSchedule?.gameDates || []) {
      for (const g of day.games || []) {
        if (g.gameCode && g.gameId) out[g.gameCode] = g.gameId;
      }
    }
    return okJson(out, {
      "Cache-Control":
        "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400",
    });
  } catch {
    return errJson("Failed to fetch WNBA schedule", 500);
  }
};
