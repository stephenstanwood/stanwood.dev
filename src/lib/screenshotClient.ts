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
    format: "webp",
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
  return Buffer.from(buffer).toString("base64");
}
