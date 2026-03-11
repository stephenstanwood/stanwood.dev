export const prerender = false;
import type { APIRoute } from "astro";

const VERCEL_TOKEN = import.meta.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = import.meta.env.VERCEL_PROJECT_ID;

export const GET: APIRoute = async () => {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return new Response(
      JSON.stringify({ lastDeploy: null, daysSince: null, hoursSince: null, error: "missing config" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
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
      return new Response(
        JSON.stringify({ lastDeploy: null, daysSince: null, hoursSince: null, error: "no deploys" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=300, max-age=60",
          },
        },
      );
    }

    const createdAt = new Date(deployments[0].created);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const hoursSince = Math.floor(diffMs / (1000 * 60 * 60));
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const meta = deployments[0].meta ?? {};
    const commitMessage = meta.githubCommitMessage ?? null;

    return new Response(
      JSON.stringify({
        lastDeploy: createdAt.toISOString(),
        daysSince,
        hoursSince,
        commitMessage,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, max-age=60",
        },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({ lastDeploy: null, daysSince: null, hoursSince: null, error: "api error" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
