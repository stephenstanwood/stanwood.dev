export const prerender = false;
export const config = { maxDuration: 60 };

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { errJson, devErrJson, okJson, toErrMsg } from "../../lib/apiHelpers";
import { extractText, stripFences, CLAUDE_SONNET, getAnthropicClient } from "../../lib/models";
import { getSystemPrompt, MUSEUM_STYLES } from "../../lib/museumPrompt";
import { logEvent } from "../../lib/logger";

const client = getAnthropicClient();

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // ~10 MB of base64 chars

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, 20)) return rateLimitResponse();

  let image: unknown;
  let style: unknown;
  try {
    ({ image, style } = await request.json());
  } catch {
    return errJson("invalid request body", 400);
  }

  // Both must be strings, not merely truthy — a non-string `image` would otherwise
  // reach `.match()` below and throw an unhandled TypeError.
  if (typeof image !== "string" || typeof style !== "string" || !image || !style) {
    return errJson("missing image or style", 400);
  }

  if (!MUSEUM_STYLES.some((s) => s.id === style)) {
    return errJson(`unknown style: ${style}`, 400);
  }

  const match = image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return errJson("invalid image format — send a base64 data URL", 400);

  if (!ALLOWED_TYPES.includes(match[1] as AllowedType)) {
    return errJson("unsupported image type — use JPEG, PNG, GIF, or WebP", 400);
  }
  const mediaType = match[1] as AllowedType;
  const imageData = match[2];

  if (imageData.length > MAX_IMAGE_SIZE) {
    return errJson("image too large (max 10 MB)", 400);
  }

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
  } catch (err: unknown) {
    console.error("museum-label error:", err);
    return devErrJson(
      "The curator stepped away mid-label. Please try again in a moment.",
      toErrMsg(err),
    );
  }
};
