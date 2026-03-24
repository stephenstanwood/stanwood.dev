export const prerender = false;
export const config = { maxDuration: 120 };

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { CLAUDE_SONNET } from "../../../lib/models";
import { errJson, isValidUrl } from "../../../lib/apiHelpers";
import { buildAnalyzePrompt } from "../../../lib/redesignRolodex/prompt";
import { ProgressiveJsonParser } from "../../../lib/redesignRolodex/streamParser";
import type { WeirdnessMode } from "../../../lib/redesignRolodex/types";

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
    delay: "1",
    timeout: "15",
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

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

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

    const urlStr = parsed.toString();

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        try {
          // Phase 1: Capture screenshot
          let screenshotBase64: string;
          try {
            screenshotBase64 = await captureScreenshot(urlStr);
            send("screenshot", { screenshotBase64 });
          } catch (err) {
            console.error("Screenshot failed:", err);
            // Continue without screenshot
            screenshotBase64 = "";
            send("screenshot", { screenshotBase64: "", error: "Screenshot unavailable" });
          }

          // Phase 2: Stream Claude response with progressive parsing
          const prompt = buildAnalyzePrompt(urlStr, mode);
          const parser = new ProgressiveJsonParser();

          const messageContent: Anthropic.MessageCreateParams["messages"][0]["content"] = screenshotBase64
            ? [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: screenshotBase64,
                  },
                },
                { type: "text", text: prompt },
              ]
            : prompt;

          const stream_ = client.messages.stream({
            model: CLAUDE_SONNET,
            max_tokens: 16000,
            messages: [{ role: "user", content: messageContent }],
          });

          for await (const event of stream_) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const events = parser.feed(event.delta.text);
              for (const ev of events) {
                send(ev.type, ev.data);
              }
            }
          }

          send("done", {});
        } catch (err) {
          console.error("redesign-rolodex analyze stream error:", err);
          const errMsg = err instanceof Error ? err.message : String(err);
          let message = "Something went wrong. Try again in a moment.";
          if (errMsg === "Failed to capture screenshot")
            message = "Couldn't capture that site. It may be blocking screenshots or unreachable.";
          else if (errMsg === "Screenshot API key not configured")
            message = "Screenshot service not available right now.";
          else if (errMsg.includes("JSON"))
            message = "AI returned an unexpected format. Try again.";

          send("error", { error: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("redesign-rolodex analyze error:", err);
    return errJson("Something went wrong. Try again in a moment.", 500);
  }
};
