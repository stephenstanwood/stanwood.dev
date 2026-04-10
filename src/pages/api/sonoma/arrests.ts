export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { errJson, okJson, fetchWithTimeout, toErrMsg } from "../../../lib/apiHelpers";

const SOCRATA_BASE = "https://data.sonomacounty.ca.gov/resource/f6uf-eqmk.json";

// Only select non-PII fields
const SAFE_FIELDS = [
  "datetimearrested",
  "chargedescription",
  "arrestcity",
  "arrestdegree",
  "race",
  "gender",
  "age",
  "fullagencyname",
].join(",");

export const GET: APIRoute = async ({ clientAddress, url }) => {
  if (!rateLimit(clientAddress, 30)) return rateLimitResponse();

  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10) || 25, 50);

  const params = new URLSearchParams({
    $order: "datetimearrested DESC",
    $limit: String(limit),
    $select: SAFE_FIELDS,
  });

  const appToken = import.meta.env.SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (appToken) {
    headers["X-App-Token"] = appToken;
  }

  try {
    const res = await fetchWithTimeout(`${SOCRATA_BASE}?${params}`, { headers }, 8000);
    if (!res.ok) {
      return errJson(`Socrata API error: ${res.status}`, 502);
    }

    const raw = await res.json();

    // Map to clean shape, strip any remaining PII
    const arrests = (raw as Record<string, string>[]).map((r) => ({
      date: r.datetimearrested || "",
      charge: (r.chargedescription || "").replace(/<br\s*\/?>/gi, " | ").trim(),
      city: r.arrestcity || "",
      degree: r.arrestdegree || "",
      race: r.race || "",
      gender: r.gender || "",
      age: parseInt(r.age, 10) || 0,
      agency: r.fullagencyname || "",
    }));

    return okJson(
      { arrests },
      { "Cache-Control": "public, s-maxage=300, max-age=60" },
    );
  } catch (err) {
    return errJson(`Failed to fetch arrest data: ${toErrMsg(err)}`, 502);
  }
};
