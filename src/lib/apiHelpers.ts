/** Shared API response helpers. */

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export function errJson(error: string, status: number): Response {
  return jsonResponse({ error }, status);
}

export function okJson(data: unknown, extraHeaders?: Record<string, string>): Response {
  return jsonResponse(data, 200, extraHeaders);
}

export function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 10_000,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

export function validateLatLon(
  lat: unknown,
  lon: unknown,
): { latitude: number; longitude: number } | null {
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return null;
  }
  return { latitude: lat, longitude: lon };
}

/** Narrow an unknown JSON value to a plain (non-array) object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Extract a string message from an unknown caught value. */
export function toErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Build a 500 error JSON response. In development, includes a `debug` field with the raw
 * error message so internals are never exposed to production clients.
 */
export function devErrJson(message: string, errMsg: string): Response {
  const body =
    import.meta.env.DEV ? { error: message, debug: errMsg } : { error: message };
  return jsonResponse(body, 500);
}

/**
 * Parse a user-supplied URL from a request body. Returns the parsed URL, or an error
 * Response (which the caller should return directly) when it's missing, non-string,
 * invalid, or points at a private/SSRF target.
 */
export function parseRequestUrl(rawUrl: unknown): URL | Response {
  if (!rawUrl || typeof rawUrl !== "string") return errJson("No URL provided", 400);
  const parsed = isValidUrl(rawUrl);
  if (!parsed) return errJson("Invalid or private URL", 400);
  return parsed;
}

/**
 * Validate a user-supplied URL and block SSRF targets (localhost, RFC-1918 ranges, .local/.internal).
 * Returns the parsed URL on success, null on failure.
 */
function isValidUrl(input: string): URL | null {
  // CLEANUP-FLAG: this hostname denylist accepts other 127/8 loopback addresses
  // and cannot check DNS resolution or redirect destinations. Complete SSRF
  // protection needs a contract at the screenshot service's fetch boundary.
  try {
    let normalized = input.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      // RFC 1918: only 172.16.0.0–172.31.255.255, not all of 172.x.x.x
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      // Link-local range (AWS/GCP metadata endpoints)
      /^169\.254\./.test(hostname)
    ) {
      return null;
    }
    if (!hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}
