/**
 * Minimal in-memory, single-value TTL cache for API routes.
 *
 * Serverless functions don't share memory across instances, so this only helps when the
 * same warm instance handles repeated requests within its lifetime — CDN headers
 * (s-maxage / stale-while-revalidate) remain the real caching layer. This standardizes the
 * freshness check that several routes were hand-rolling with inconsistent field names.
 */
export function createTtlCache<T>(ttlMs: number) {
  let entry: { value: T; fetchedAt: number } | null = null;
  return {
    /** The cached value if still within its TTL, else null. */
    get(now = Date.now()): T | null {
      return entry && now - entry.fetchedAt < ttlMs ? entry.value : null;
    },
    /** Store a value, stamping it as fetched now. */
    set(value: T): void {
      entry = { value, fetchedAt: Date.now() };
    },
    /** The last stored value regardless of freshness — for stale-on-error fallbacks. */
    stale(): T | null {
      return entry ? entry.value : null;
    },
  };
}
