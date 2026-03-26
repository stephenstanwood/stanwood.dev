import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { errJson, okJson } from "../../../lib/apiHelpers";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { CLAUDE_HAIKU, extractText, stripFences } from "../../../lib/models";
import { fetchLatestAgenda, fetchAgendaContent } from "../../../lib/campbell/agendaScraper";
import type { DigestSummary } from "../../../lib/campbell/types";

export const prerender = false;

// Cache the digest for 24 hours (agendas don't change after posting)
let cached: { data: DigestSummary; ts: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000;

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

export const POST: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress, 20)) return rateLimitResponse();

  // Serve from cache if fresh
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return okJson(cached.data);
  }

  if (!import.meta.env.ANTHROPIC_API_KEY) return errJson("Service not configured", 503);

  // 1. Scrape the latest agenda
  const agenda = await fetchLatestAgenda();
  if (!agenda) return errJson("Could not fetch agenda data", 502);

  // 2. Get the agenda content
  const content = await fetchAgendaContent(agenda.pdfUrl);
  if (!content) return errJson("Could not read agenda content", 502);

  // 3. Summarize with Claude
  const prompt = `You are summarizing a Campbell, CA city council meeting agenda for residents.

Given the following agenda text, produce a JSON object with these fields:
- "meetingDate": the date of the meeting (string)
- "title": a short title like "City Council Regular Meeting — March 18, 2026" (string)
- "summary": a 2-3 sentence plain-English summary of what this meeting covers (string)
- "keyTopics": an array of 3-6 short bullet points about the main agenda items (string[])
- "nextMeeting": when the next meeting likely is, based on 1st/3rd Tuesday pattern, or null (string|null)

Write for a general audience. No jargon. Be specific about what's being discussed.

Agenda text:
${content}`;

  try {
    const message = await client.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = extractText(message.content);
    const parsed: DigestSummary = JSON.parse(stripFences(raw));

    // Add metadata
    parsed.sourceUrl = agenda.url;
    parsed.generatedAt = new Date().toISOString();

    // Cache it
    cached = { data: parsed, ts: Date.now() };

    return okJson(parsed);
  } catch (e) {
    console.error("Digest error:", e);
    return errJson("Failed to generate digest", 500);
  }
};
