export const prerender = false;

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { VIBE_SYSTEM_PROMPT, type VibeResult } from "../../lib/vibePrompt";

const RATE_LIMIT_MAX = 20;

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

function isValidUrl(input: string): URL | null {
  try {
    let normalized = input.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    // Block private/local addresses
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return null;
    }
    // Must have a dot (real domain)
    if (!hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

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

    if (!rawUrl || typeof rawUrl !== "string") {
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = isValidUrl(rawUrl);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Invalid or private URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const screenshotBase64 = await captureScreenshot(parsed.toString());

    const message = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
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

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response format");
    }

    // Parse the JSON response, handling potential markdown code fences
    let jsonText = block.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

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
    const debug = errMsg || JSON.stringify(err);
    if (errMsg === "Failed to capture screenshot") {
      message = "Couldn't capture that site. It may be blocking screenshots or unreachable.";
    } else if (errMsg === "Screenshot API key not configured") {
      message = "Screenshot service not configured. Check SCREENSHOTONE_API_KEY.";
    } else if (errMsg.includes("JSON")) {
      message = "AI returned an unexpected format. Try again.";
    }
    return new Response(JSON.stringify({ error: message, debug }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
