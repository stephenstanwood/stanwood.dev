export const prerender = false;

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { CLAUDE_SONNET } from "../../lib/models";

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
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text too long (max ${MAX_TEXT_LENGTH} characters)` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    const block = message.content[0];
    const title = block.type === "text" ? block.text.trim() : text.trim();

    return new Response(JSON.stringify({ title }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("condense error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
