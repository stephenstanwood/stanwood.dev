export const prerender = false;

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { CLAUDE_SONNET, extractText } from "../../lib/models";
import { errJson, okJson } from "../../lib/apiHelpers";

const MAX_TEXT_LENGTH = 5_000;

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  try {
    const body = await request.json();
    const text = body?.text;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return errJson("No text provided", 400);
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return errJson(`Text too long (max ${MAX_TEXT_LENGTH} characters)`, 400);
    }

    const message = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: `Condense the following into a short, catchy project-idea title (3–8 words). Capitalize it like a title. Return ONLY the title, nothing else.\n\n"${text.trim()}"`,
        },
      ],
    });

    const title = extractText(message.content) || text.trim();

    return okJson({ title });
  } catch (err) {
    console.error("condense error:", err);
    return errJson("Something went wrong", 500);
  }
};
