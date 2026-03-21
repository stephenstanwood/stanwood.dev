export const prerender = false;

export const config = {
  maxDuration: 60,
};

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { MUSEUM_SYSTEM_PROMPT, type MuseumLabel, type LabelStyle } from "../../lib/museumPrompt";

const RATE_LIMIT_MAX = 20;

const VALID_STYLES: LabelStyle[] = ["museum", "archaeology", "modern-art", "grandiose", "auction"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB base64

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, RATE_LIMIT_MAX)) return rateLimitResponse();

  try {
    const body = await request.json();
    const { image, mediaType, style, hint } = body as {
      image?: string;
      mediaType?: string;
      style?: string;
      hint?: string;
    };

    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (image.length > MAX_IMAGE_SIZE) {
      return new Response(JSON.stringify({ error: "Image too large. Please use a smaller photo." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validMediaTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!mediaType || !validMediaTypes.includes(mediaType)) {
      return new Response(JSON.stringify({ error: "Unsupported image format. Use JPEG, PNG, WebP, or GIF." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const labelStyle = style && VALID_STYLES.includes(style as LabelStyle) ? style : "museum";

    let userText = `Write a museum label for this object in the "${labelStyle}" style.`;
    if (hint && typeof hint === "string" && hint.trim().length > 0) {
      userText += ` The user says this object is: "${hint.trim().slice(0, 200)}"`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: MUSEUM_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: image,
              },
            },
            {
              type: "text",
              text: userText,
            },
          ],
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response format");
    }

    let jsonText = block.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result: MuseumLabel = JSON.parse(jsonText);

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("museum-label error:", err);
    let message = "Something went wrong. Try again in a moment.";
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("JSON")) {
      message = "AI returned an unexpected format. Try again.";
    }
    const isDev = import.meta.env.DEV;
    const body = isDev ? { error: message, debug: errMsg } : { error: message };
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
