export const prerender = false;
export const config = { maxDuration: 60 };

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { errJson, okJson } from "../../lib/apiHelpers";
import { extractText, stripFences, CLAUDE_SONNET } from "../../lib/models";
import { getSystemPrompt, MUSEUM_STYLES } from "../../lib/museumPrompt";
import { logEvent } from "../../lib/logger";

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, 20)) return rateLimitResponse();

  let image: string;
  let style: string;
  try {
    ({ image, style } = await request.json());
  } catch {
    return errJson("invalid request body", 400);
  }

  if (!image || !style) return errJson("missing image or style", 400);

  if (!MUSEUM_STYLES.some((s) => s.id === style)) {
    return errJson(`unknown style: ${style}`, 400);
  }

  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return errJson("invalid image format — send a base64 data URL", 400);

  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const imageData = match[2];

  try {
    const response = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 1024,
      system: getSystemPrompt(style),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
            { type: "text", text: "Write the museum placard label for this object." },
          ],
        },
      ],
    });

    const text = stripFences(extractText(response.content));
    const label = JSON.parse(text);

    logEvent("museum-label-generate", { style });
    return okJson(label, { "Cache-Control": "public, max-age=300" });
  } catch (err) {
    console.error("museum-label error:", err);
    return errJson("Something went wrong", 500);
  }
};
