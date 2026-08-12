import { errJson } from "./apiHelpers";
import { MS_PER_MINUTE } from "./time";

const hits = new Map<string, number[]>();

const DEFAULT_MAX = 200;
const DEFAULT_WINDOW_MS = MS_PER_MINUTE;
const CLEANUP_INTERVAL_MS = 5 * MS_PER_MINUTE;
const MAX_ENTRIES = 10_000;

let lastCleanup = Date.now();

// The map is shared by every route, but routes configure different windows (the default
// minute, /api/feedback's ten). Prune against the widest window seen so far — pruning with
// the caller's window would drop still-live hits for longer-windowed routes and hand the
// caller a free reset.
let widestWindowMs = DEFAULT_WINDOW_MS;

/** Remove stale IP entries to prevent unbounded memory growth. */
function cleanup() {
  const now = Date.now();
  for (const [ip, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < widestWindowMs);
    if (recent.length === 0) {
      hits.delete(ip);
    } else {
      hits.set(ip, recent);
    }
  }
  lastCleanup = now;
}

export function rateLimit(
  ip: string,
  max: number = DEFAULT_MAX,
  windowMs: number = DEFAULT_WINDOW_MS,
): boolean {
  const now = Date.now();
  if (windowMs > widestWindowMs) widestWindowMs = windowMs;

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanup();
  }

  const timestamps = hits.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    hits.set(ip, recent);
    return false;
  }

  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > MAX_ENTRIES) {
    // Safe: size > MAX_ENTRIES guarantees at least one entry exists
    hits.delete(hits.keys().next().value!);
  }
  return true;
}

export function rateLimitResponse(): Response {
  return errJson("Too many requests. Please try again in a minute.", 429);
}
