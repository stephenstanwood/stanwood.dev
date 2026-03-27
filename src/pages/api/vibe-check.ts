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
import { errJson, okJson, devErrJson, isValidUrl, toErrMsg } from "../../lib/apiHelpers";
import { captureScreenshot, screenshotErrorMessage } from "../../lib/screenshotClient";

const RATE_LIMIT_MAX = 20;

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

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

    return okJson(result, { "Cache-Control": "public, max-age=3600" });
  } catch (err) {
    console.error("vibe-check error:", err);
    const errMsg = toErrMsg(err);
    // devErrJson includes debug detail in development only — never exposes internals to production clients
    return devErrJson(screenshotErrorMessage(errMsg), errMsg);
  }
};
