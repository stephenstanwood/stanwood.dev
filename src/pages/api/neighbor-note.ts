export const prerender = false;

export const config = {
  maxDuration: 30,
};

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";

const RATE_LIMIT_MAX = 30;

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You write short, polite neighbor notes for awkward real-life situations. Your job is to make the note sound human, clear, warm, and non-passive-aggressive. Keep it concise. Avoid legalistic language, fake cheerfulness, or excessive formality. Preserve the user's facts and intent without adding new claims.

Rules:
- Write like a thoughtful normal adult
- Avoid corporate tone
- Never use the word "kindly"
- Avoid fake sweetness
- Avoid confrontation unless the user explicitly requests directness
- Preserve factual content exactly as given
- Never invent facts or details the user didn't provide
- Default to de-escalation
- Never imply legal action, HOA escalation, or threats
- If the user's input sounds aggressive, soften the tone but keep the core ask intact
- Never be creepy or overly familiar
- Keep notes specific — use the details provided

You must respond with valid JSON in this exact format:
{
  "short": "A 1-2 sentence note. Friendly and to the point.",
  "medium": "A 3-4 sentence note with a bit more warmth and context.",
  "text": "A casual text message version. Can use common texting style but still polite.",
  "printable": "A slightly more complete note suitable for leaving on a door. Includes a greeting and sign-off. Still concise.",
  "warning": null
}

If the user's input contains aggressive, threatening, or hostile language, set "warning" to a brief string explaining the concern (e.g. "Softened some strong language to keep it neighborly"). Otherwise keep it null.

Do not include markdown code fences. Return only the JSON object.`;

interface NoteRequest {
  scenario: string;
  details?: string;
  neighborName?: string;
  address?: string;
  contactInfo?: string;
  outcome?: string;
  tone: "warm" | "neutral" | "direct";
}

function buildUserPrompt(req: NoteRequest): string {
  const parts: string[] = [];

  parts.push(`Scenario: ${req.scenario}`);

  if (req.details) parts.push(`Details: ${req.details}`);
  if (req.neighborName) parts.push(`Neighbor's name: ${req.neighborName}`);
  if (req.address) parts.push(`Address/unit: ${req.address}`);
  if (req.contactInfo) parts.push(`My contact info: ${req.contactInfo}`);
  if (req.outcome) parts.push(`What I'd like: ${req.outcome}`);

  const toneMap = {
    warm: "Warm and friendly — like you genuinely like your neighbor",
    neutral: "Neutral and clear — polite but not overly warm",
    direct: "Friendly but direct — get to the point without being harsh",
  };
  parts.push(`Tone: ${toneMap[req.tone]}`);

  return parts.join("\n");
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, RATE_LIMIT_MAX)) return rateLimitResponse();

  try {
    const body = await request.json();

    if (!body?.scenario || typeof body.scenario !== "string") {
      return new Response(
        JSON.stringify({ error: "Please select or describe a scenario" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!body?.tone || !["warm", "neutral", "direct"].includes(body.tone)) {
      return new Response(
        JSON.stringify({ error: "Invalid tone selection" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const userPrompt = buildUserPrompt(body as NoteRequest);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response format");
    }

    let jsonText = block.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonText);

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("neighbor-note error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    let message = "Something went wrong. Try again in a moment.";
    if (errMsg.includes("JSON")) {
      message = "AI returned an unexpected format. Try again.";
    }
    const isDev = import.meta.env.DEV;
    const body = isDev
      ? { error: message, debug: errMsg }
      : { error: message };
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
