export const prerender = false;
import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_HAIKU, extractText } from "../../lib/models";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { okJson } from "../../lib/apiHelpers";

const VERCEL_TOKEN = import.meta.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = import.meta.env.VERCEL_PROJECT_ID;
const ANTHROPIC_API_KEY = import.meta.env.ANTHROPIC_API_KEY;

const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;

/** Strip PR refs and clean up a raw commit message */
function cleanRaw(raw: string): string {
  return raw.split("\n")[0].trim().replace(/\s*\(#\d+\)\s*$/g, "");
}

/** Ask Claude to turn a raw commit message into a nice one-liner */
async function summarizeCommit(raw: string): Promise<{ project: string | null; summary: string }> {
  const cleaned = cleanRaw(raw);

  if (!anthropic) {
    return { project: null, summary: cleaned };
  }

  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `You're writing a one-line changelog entry for a personal dev portfolio site. Given this git commit message, return JSON with two fields:
- "project": the project/feature name in Title Case (or null if unclear)
- "summary": a short, punchy past-tense description (start with a verb like "Added", "Fixed", "Built", etc.). Keep it under 60 chars, no period at the end. Write for a general audience — no jargon. Never include PR numbers, issue numbers, or (#123) references.

Commit message: "${cleaned}"

Return ONLY valid JSON, nothing else.`,
        },
      ],
    });

    const parsed = JSON.parse(extractText(res.content));
    return {
      project: parsed.project ?? null,
      summary: parsed.summary ?? cleaned,
    };
  } catch {
    return { project: null, summary: cleaned };
  }
}

export const GET: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress, 10)) return rateLimitResponse();

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return okJson({ lastDeploy: null, daysSince: null, hoursSince: null, error: "missing config" });
  }

  try {
    const url = `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&target=production&limit=1&state=READY`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Vercel API ${res.status}`);

    const data = await res.json();
    const deployments = data.deployments ?? [];

    if (deployments.length === 0) {
      return okJson(
        { lastDeploy: null, daysSince: null, hoursSince: null, error: "no deploys" },
        { "Cache-Control": "public, s-maxage=300, max-age=60" },
      );
    }

    const createdAt = new Date(deployments[0].created);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const hoursSince = Math.floor(diffMs / (1000 * 60 * 60));
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const meta = deployments[0].meta ?? {};
    const rawCommit = meta.githubCommitMessage ?? null;
    const sha = (meta.githubCommitSha ?? deployments[0].uid ?? "").slice(0, 7) || null;
    const prMatch = rawCommit?.match(/\(#(\d+)\)/);
    const prNumber = prMatch ? prMatch[1] : null;

    // Summarize via Claude (cached for 5 min by s-maxage anyway)
    let project: string | null = null;
    let summary: string | null = null;
    if (rawCommit) {
      const result = await summarizeCommit(rawCommit);
      project = result.project;
      summary = result.summary;
    }

    return okJson(
      { lastDeploy: createdAt.toISOString(), daysSince, hoursSince, project, summary, sha, prNumber },
      { "Cache-Control": "public, s-maxage=300, max-age=60" },
    );
  } catch (err) {
    console.error("ship-clock fetch failed:", err);
    return okJson({ lastDeploy: null, daysSince: null, hoursSince: null, error: "api error" });
  }
};
