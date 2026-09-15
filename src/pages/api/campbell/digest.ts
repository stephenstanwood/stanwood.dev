import type { APIRoute } from "astro";
import { errJson, devErrJson, isRecord, okJson, toErrMsg } from "../../../lib/apiHelpers";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { CLAUDE_SONNET, extractText, stripFences, getAnthropicClient } from "../../../lib/models";
import { getLatestAgenda } from "../../../lib/campbell/agendaScraper";
import type { DigestSummary } from "../../../lib/campbell/types";
import { MS_PER_DAY } from "../../../lib/time";
import { createTtlCache } from "../../../lib/ttlCache";

export const prerender = false;

// Cache the digest for 24 hours (agendas don't change after posting)
const digestCache = createTtlCache<DigestSummary>(MS_PER_DAY);

const client = getAnthropicClient();

export const POST: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress, 20)) return rateLimitResponse();

  const fresh = digestCache.get();
  if (fresh) return okJson(fresh);

  if (!import.meta.env.ANTHROPIC_API_KEY) return errJson("Service not configured", 503);

  // 1. Read the bundled agenda text (refreshed by the nightly data sync)
  const agenda = getLatestAgenda();
  if (!agenda) return errJson("No council agenda available yet", 502);
  const content = agenda.content;

  // 2. Summarize with Claude
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
      model: CLAUDE_SONNET,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = extractText(message.content);
    const parsed: unknown = JSON.parse(stripFences(raw));
    // Model output is untrusted: never cache a non-object payload as a digest.
    if (!isRecord(parsed)) throw new Error("Digest response was not a JSON object");

    // 3. Add metadata
    const digest = {
      ...parsed,
      sourceUrl: agenda.url,
      generatedAt: new Date().toISOString(),
    } as DigestSummary;

    digestCache.set(digest);

    return okJson(digest);
  } catch (err) {
    console.error("Digest error:", err);
    return devErrJson("Failed to generate digest", toErrMsg(err));
  }
};
