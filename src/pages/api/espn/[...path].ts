import type { APIRoute } from "astro";
import { fetchWithTimeout, isRecord, jsonResponse, okJson } from "../../../lib/apiHelpers";
import { rateLimit } from "../../../lib/rateLimit";
import { LEAGUES } from "../../../lib/teamRegistry";

export const prerender = false;

// Only existing scoreboards are exposed. No caller-supplied hosts, arbitrary
// paths, query forwarding, or upstream redirects.
const SCOREBOARDS = new Set(LEAGUES.map(({ path }) => path + "/scoreboard"));
const UPSTREAM = "https://site.api.espn.com/apis/site/v2/sports/";

function failure(message: string, status: number): Response {
  return jsonResponse({ error: message }, status, { "Cache-Control": "no-store" });
}

function unavailable(retryAfter?: string): Response {
  return jsonResponse({ error: "Sports scores are unavailable. Please try again." }, 502, {
    "Cache-Control": "no-store",
    ...(retryAfter ? { "Retry-After": retryAfter } : {}),
  });
}

function validDate(value: string): boolean {
  if (!/^\d{8}$/.test(value)) return false;
  const iso = value.slice(0, 4) + "-" + value.slice(4, 6) + "-" + value.slice(6, 8);
  const date = new Date(iso + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

export const GET: APIRoute = async ({ params, url, clientAddress }) => {
  if (!params.path || !SCOREBOARDS.has(params.path)) return failure("Unknown scoreboard", 404);
  const keys = [...url.searchParams.keys()];
  const dates = url.searchParams.get("dates");
  if (keys.some((key) => key !== "dates") || keys.length > 1 || (dates !== null && !validDate(dates))) {
    return failure("Use a single calendar date in YYYYMMDD format", 400);
  }
  if (!rateLimit("espn:" + clientAddress)) {
    return failure("Too many requests. Please try again in a minute.", 429);
  }

  const upstream = new URL(params.path, UPSTREAM);
  if (dates) upstream.searchParams.set("dates", dates);
  let res: Response;
  try {
    res = await fetchWithTimeout(upstream.href, {
      headers: { Accept: "application/json" },
      redirect: "error",
    }, 8000);
  } catch (error) {
    // A timeout can be temporary. Leave other failures, such as a refused redirect, alone.
    return unavailable(error instanceof Error && error.name === "TimeoutError" ? "1" : undefined);
  }
  // Upstream denial or throttling must not trigger an automatic retry.
  if (!res.ok) {
    return unavailable(res.status >= 500 ? res.headers.get("Retry-After") ?? "1" : undefined);
  }
  try {
    const data: unknown = await res.json();
    if (!isRecord(data) || !Array.isArray(data.events)) return unavailable();
    return okJson({ events: data.events }, {
      "Cache-Control": "public, max-age=0, s-maxage=15",
    });
  } catch {
    return unavailable();
  }
};
