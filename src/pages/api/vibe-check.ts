export const prerender = false;

// Vercel serverless config — screenshot + AI analysis needs more than the 10s default
export const config = {
  maxDuration: 60,
};

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { CLAUDE_SONNET, extractText, stripFences } from "../../lib/models";
import { VIBE_SYSTEM_PROMPT, type VibeResult } from "../../lib/vibePrompt";
import { errJson, isValidUrl } from "../../lib/apiHelpers";

const RATE_LIMIT_MAX = 20;

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

async function captureScreenshot(url: string): Promise<string> {
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
    delay: "2",
    timeout: "30",
  });

  const response = await fetch(
    `https://api.screenshotone.com/take?${params.toString()}`
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Screenshot API error:", response.status, text);
    throw new Error("Failed to capture screenshot");
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, RATE_LIMIT_MAX)) return rateLimitResponse();

  try {
    const body = await request.json();
    const rawUrl = body?.url;

    if (!rawUrl || typeof rawUrl !== "string") return errJson("No URL provided", 400);

    const parsed = isValidUrl(rawUrl);
    if (!parsed) return errJson("Invalid or private URL", 400);

    const screenshotBase64 = await captureScreenshot(parsed.toString());

    const message = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 1024,
      system: VIBE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: screenshotBase64,
              },
            },
            {
              type: "text",
              text: `Analyze this website screenshot and provide a vibe check assessment. The URL is: ${parsed.toString()}`,
            },
          ],
        },
      ],
    });

    const jsonText = stripFences(extractText(message.content));
    if (!jsonText) throw new Error("Unexpected response format");

    const result: VibeResult = JSON.parse(jsonText);

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("vibe-check error:", err);
    let message = "Something went wrong. Try again in a moment.";
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg === "Failed to capture screenshot") {
      message = "Couldn't capture that site. It may be blocking screenshots or unreachable.";
    } else if (errMsg === "Screenshot API key not configured") {
      message = "Screenshot service not available right now.";
    } else if (errMsg.includes("JSON")) {
      message = "AI returned an unexpected format. Try again.";
    }
    // Only include debug detail in development — never expose internal errors to production clients
    const isDev = import.meta.env.DEV;
    const body = isDev ? { error: message, debug: errMsg } : { error: message };
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
