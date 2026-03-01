const hits = new Map<string, number[]>();

const MAX_REQUESTS = 20;
const WINDOW_MS = 60_000; // 1 minute

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = hits.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return false; // rejected
  }

  recent.push(now);
  hits.set(ip, recent);
  return true; // allowed
}

export function rateLimitResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again in a minute." }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}
