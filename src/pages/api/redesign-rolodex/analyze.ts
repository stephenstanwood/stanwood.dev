export const prerender = false;
export const config = { maxDuration: 120 };

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { CLAUDE_SONNET } from "../../../lib/models";
import { errJson, isValidUrl, toErrMsg } from "../../../lib/apiHelpers";
import { captureScreenshot, screenshotErrorMessage } from "../../../lib/screenshotClient";
import { buildAnalyzePrompt } from "../../../lib/redesignRolodex/prompt";
import { ProgressiveJsonParser } from "../../../lib/redesignRolodex/streamParser";
import { VALID_MODES } from "../../../lib/redesignRolodex/types";
import type { WeirdnessMode } from "../../../lib/redesignRolodex/types";

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Each request burns a screenshot API call + a long Claude stream — keep tight
  if (!rateLimit(clientAddress, 5)) return rateLimitResponse();

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
                    media_type: "image/jpeg",
                    data: screenshotBase64,
                  },
                },
                { type: "text", text: prompt },
              ]
            : prompt;

          const claudeStream = client.messages.stream({
            model: CLAUDE_SONNET,
            max_tokens: 16000,
            messages: [{ role: "user", content: messageContent }],
          });

          // Hard timeout — serverless maxDuration is 120s but we want an
          // explicit error rather than a silent infrastructure kill
          const timeout = setTimeout(() => claudeStream.abort(), 90_000);
          try {
            for await (const event of claudeStream) {
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
          } finally {
            clearTimeout(timeout);
            parser.clear();
          }

          send("done", {});
        } catch (err) {
          console.error("redesign-rolodex analyze stream error:", err);
          const errMsg = toErrMsg(err);
          // Timeout gets its own message; everything else goes through shared screenshot error helper
          const message =
            errMsg.includes("abort") || errMsg.includes("timed out")
              ? "Analysis took too long. Try a simpler URL."
              : screenshotErrorMessage(errMsg);

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
