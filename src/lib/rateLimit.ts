const hits = new Map<string, number[]>();

const MAX_REQUESTS = 200;
const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

let lastCleanup = Date.now();

/** Remove stale IP entries to prevent unbounded memory growth. */
function cleanup() {
  const now = Date.now();
  for (const [ip, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) {
      hits.delete(ip);
    } else {
      hits.set(ip, recent);
    }
  }
  lastCleanup = now;
}

export function rateLimit(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup of stale entries
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanup();
  }

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
