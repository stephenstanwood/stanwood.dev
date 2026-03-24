import { fetchWithTimeout } from "./apiHelpers";

/**
 * Capture a screenshot of the given URL via screenshotone.com.
 * Returns a base64-encoded PNG string.
 * Throws "Screenshot API key not configured" or "Failed to capture screenshot" on failure.
 */
export async function captureScreenshot(url: string): Promise<string> {
  const apiKey = import.meta.env.SCREENSHOTONE_API_KEY;
  if (!apiKey) throw new Error("Screenshot API key not configured");

  const params = new URLSearchParams({
    access_key: apiKey,
    url,
    viewport_width: "1280",
    viewport_height: "800",
    format: "png",
    block_ads: "true",
    block_cookie_banners: "true",
    delay: "1",
    timeout: "15",
  });

  // screenshotone has a 15s timeout + 1s delay; cap our end to avoid hanging the lambda
  const response = await fetchWithTimeout(
    `https://api.screenshotone.com/take?${params.toString()}`,
    {},
    25_000,
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Screenshot API error:", response.status, text);
    throw new Error("Failed to capture screenshot");
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
