import { fetchWithTimeout } from "./apiHelpers";

const CACHE_TTL_MS = 10 * 60_000; // 10 minutes
const cache = new Map<string, { base64: string; expiresAt: number }>();

/**
 * Translate a thrown error from captureScreenshot into a user-facing message.
 * Both vibe-check and redesign-rolodex use this same translation logic.
 */
export function screenshotErrorMessage(errMsg: string): string {
  if (errMsg === "Failed to capture screenshot") {
    return "Couldn't capture that site. It may be blocking screenshots or unreachable.";
  }
  if (errMsg === "Screenshot API key not configured") {
    return "Screenshot service not available right now.";
  }
  if (errMsg.includes("JSON")) {
    return "AI returned an unexpected format. Try again.";
  }
  return "Something went wrong. Try again in a moment.";
}

/**
 * Capture a screenshot of the given URL via screenshotone.com.
 * Results are cached in-memory for 10 minutes to avoid redundant API calls.
 * Returns a base64-encoded JPEG string.
 * Throws "Screenshot API key not configured" or "Failed to capture screenshot" on failure.
 */
export async function captureScreenshot(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached && Date.now() < cached.expiresAt) return cached.base64;
  const apiKey = import.meta.env.SCREENSHOTONE_API_KEY;
  if (!apiKey) throw new Error("Screenshot API key not configured");

  const params = new URLSearchParams({
    access_key: apiKey,
    url,
    viewport_width: "1280",
    viewport_height: "800",
    format: "jpeg",
    image_quality: "80",
    block_ads: "true",
    block_cookie_banners: "true",
    delay: "0",
    timeout: "10",
  });

  const response = await fetchWithTimeout(
    `https://api.screenshotone.com/take?${params.toString()}`,
    {},
    15_000,
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Screenshot API error:", response.status, text);
    throw new Error("Failed to capture screenshot");
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  cache.set(url, { base64, expiresAt: Date.now() + CACHE_TTL_MS });
  return base64;
}
