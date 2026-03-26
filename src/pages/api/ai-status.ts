export const prerender = false;
import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { okJson } from "../../lib/apiHelpers";

interface StatusPageSummary {
  status: { indicator: string; description: string };
  components?: { name: string; status: string }[];
  incidents?: {
    name: string;
    status: string;
    impact: string;
    incident_updates?: { body: string; status: string }[];
  }[];
}

export interface ProviderStatus {
  id: "chatgpt" | "claude";
  name: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage" | "unknown";
  summary: string;
  incidentTitle?: string;
  incidentSummary?: string;
  statusPageUrl: string;
  checkedAt: string;
  brandColor: string;
}

// In-memory cache: { data, fetchedAt }
// CLEANUP-FLAG: serverless functions don't share memory across instances, so this cache only
// helps when the same instance handles repeated requests within its lifetime. CDN headers
// (s-maxage/stale-while-revalidate) on the response are the real caching layer here.
let cache: { data: ProviderStatus[]; fetchedAt: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function normalizeStatus(indicator: string): ProviderStatus["status"] {
  switch (indicator) {
    case "none":
      return "operational";
    case "minor":
      return "degraded";
    case "major":
      return "partial_outage";
    case "critical":
      return "major_outage";
    default:
      return "unknown";
  }
}

function statusSummary(status: ProviderStatus["status"], name: string): string {
  switch (status) {
    case "operational":
      return `${name} appears awake and well`;
    case "degraded":
      return `${name} is being a little weird`;
    case "partial_outage":
      return `Yep, it's not just you — ${name} is struggling`;
    case "major_outage":
      return `${name} is having a really bad day`;
    default:
      return `Can't tell what ${name} is up to`;
  }
}

async function fetchProvider(
  id: ProviderStatus["id"],
  name: string,
  apiUrl: string,
  statusPageUrl: string,
  brandColor: string,
): Promise<ProviderStatus> {
  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: StatusPageSummary = await res.json();
    const status = normalizeStatus(data.status?.indicator ?? "unknown");

    // Extract latest incident if any
    let incidentTitle: string | undefined;
    let incidentSummary: string | undefined;
    if (data.incidents && data.incidents.length > 0) {
      const latest = data.incidents[0];
      incidentTitle = latest.name;
      if (latest.incident_updates && latest.incident_updates.length > 0) {
        const body = latest.incident_updates[0].body;
        // Truncate to ~120 chars
        incidentSummary = body.length > 120 ? body.slice(0, 117) + "…" : body;
      }
    }

    return {
      id,
      name,
      status,
      summary: statusSummary(status, name),
      incidentTitle,
      incidentSummary,
      statusPageUrl,
      checkedAt: new Date().toISOString(),
      brandColor,
    };
  } catch {
    return {
      id,
      name,
      status: "unknown",
      summary: "Status unavailable",
      statusPageUrl,
      checkedAt: new Date().toISOString(),
      brandColor,
    };
  }
}

async function fetchAll(): Promise<ProviderStatus[]> {
  const [chatgpt, claude] = await Promise.all([
    fetchProvider(
      "chatgpt",
      "ChatGPT",
      "https://status.openai.com/api/v2/summary.json",
      "https://status.openai.com",
      "#10a37f",
    ),
    fetchProvider(
      "claude",
      "Claude",
      "https://status.anthropic.com/api/v2/summary.json",
      "https://status.anthropic.com",
      "#d97706",
    ),
  ]);
  return [claude, chatgpt];
}

export const GET: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  const AI_STATUS_CACHE_HEADERS = {
    "Cache-Control": "public, s-maxage=180, max-age=60, stale-while-revalidate=60",
  };

  // Serve from cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return okJson(cache.data, AI_STATUS_CACHE_HEADERS);
  }

  const data = await fetchAll();
  cache = { data, fetchedAt: Date.now() };

  return okJson(data, AI_STATUS_CACHE_HEADERS);
};
