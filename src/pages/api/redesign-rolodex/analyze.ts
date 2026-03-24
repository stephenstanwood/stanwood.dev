export const prerender = false;
export const config = { maxDuration: 60 };

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { CLAUDE_SONNET, extractText, stripFences } from "../../../lib/models";
import { errJson } from "../../../lib/apiHelpers";
import { buildAnalyzePrompt } from "../../../lib/redesignRolodex/prompt";
import type {
  WeirdnessMode,
  SiteAnalysis,
  DesignDirection,
} from "../../../lib/redesignRolodex/types";

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

function isValidUrl(input: string): URL | null {
  try {
    let normalized = input.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const h = url.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      h.startsWith("10.") ||
      h.startsWith("192.168.") ||
      h.startsWith("172.") ||
      h.endsWith(".local") ||
      h.endsWith(".internal")
    )
      return null;
    if (!h.includes(".")) return null;
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
    `https://api.screenshotone.com/take?${params.toString()}`,
  );

  if (!response.ok) {
    console.error("Screenshot API error:", response.status);
    throw new Error("Failed to capture screenshot");
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

const VALID_MODES: WeirdnessMode[] = [
  "client-safe",
  "designer",
  "alternate-timeline",
];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, 10)) return rateLimitResponse();

  try {
    const body = await request.json();
    const rawUrl = body?.url;
    const mode: WeirdnessMode = VALID_MODES.includes(body?.mode)
      ? body.mode
      : "designer";

    if (!rawUrl || typeof rawUrl !== "string")
      return errJson("No URL provided", 400);

    const parsed = isValidUrl(rawUrl);
    if (!parsed) return errJson("Invalid or private URL", 400);

    const screenshotBase64 = await captureScreenshot(parsed.toString());

    const prompt = buildAnalyzePrompt(parsed.toString(), mode);

    const message = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 16000,
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
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const jsonText = stripFences(extractText(message.content));
    if (!jsonText) throw new Error("Unexpected response format");

    const result = JSON.parse(jsonText) as {
      siteAnalysis: SiteAnalysis;
      directions: Omit<DesignDirection, "id">[];
    };

    // Assign sequential IDs starting at 2 (1 = current site card)
    const directions: DesignDirection[] = result.directions.map((d, i) => ({
      ...d,
      id: i + 2,
    }));

    return new Response(
      JSON.stringify({
        siteAnalysis: result.siteAnalysis,
        screenshotBase64,
        directions,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=1800",
        },
      },
    );
  } catch (err) {
    console.error("redesign-rolodex analyze error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    let message = "Something went wrong. Try again in a moment.";
    if (errMsg === "Failed to capture screenshot")
      message =
        "Couldn't capture that site. It may be blocking screenshots or unreachable.";
    else if (errMsg === "Screenshot API key not configured")
      message = "Screenshot service not available right now.";
    else if (errMsg.includes("JSON"))
      message = "AI returned an unexpected format. Try again.";

    const isDev = import.meta.env.DEV;
    const body = isDev ? { error: message, debug: errMsg } : { error: message };
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
