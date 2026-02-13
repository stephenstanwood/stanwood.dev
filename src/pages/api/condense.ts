export const prerender = false;

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  const { text } = await request.json();

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: "No text provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
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
};
