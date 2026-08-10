/** Shared crypto helpers for private-tool cookie auth. */

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string equality — both inputs are SHA-256 hex (fixed length 64).
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Check a submitted login password against the configured one and return the session
 * token (the expected password's hash) on success, or null on any failure.
 * Compares hashes rather than raw strings so the check is constant-time.
 */
export async function verifySessionPassword(
  submitted: unknown,
  expected: string | undefined,
): Promise<string | null> {
  if (typeof submitted !== "string" || !submitted || !expected) return null;
  const [submittedHash, expectedHash] = await Promise.all([
    hashPassword(submitted),
    hashPassword(expected),
  ]);
  return timingSafeEqual(submittedHash, expectedHash) ? expectedHash : null;
}

/**
 * Build the Set-Cookie header for a private-tool session. `Secure` is attached only
 * over https so login still completes against a plain-http dev server. Omit `maxAgeSeconds`
 * for a cookie that dies with the browser session.
 */
export function sessionCookie(
  name: string,
  token: string,
  requestUrl: URL,
  maxAgeSeconds?: number,
): string {
  const parts = [`${name}=${token}`, "Path=/", "HttpOnly"];
  if (requestUrl.protocol === "https:") parts.push("Secure");
  parts.push("SameSite=Strict");
  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join("; ");
}

/**
 * The post-login redirect: set the session cookie and bounce to the tool. 303 so the
 * browser re-issues as a GET, and `no-store` so the redirect itself is never cached.
 * Omit `maxAgeSeconds` for a cookie that dies with the browser session.
 */
export function loginRedirect(options: {
  location: string;
  cookieName: string;
  token: string;
  requestUrl: URL;
  maxAgeSeconds?: number;
}): Response {
  const { location, cookieName, token, requestUrl, maxAgeSeconds } = options;
  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
      "Set-Cookie": sessionCookie(cookieName, token, requestUrl, maxAgeSeconds),
      "Cache-Control": "no-store",
    },
  });
}
