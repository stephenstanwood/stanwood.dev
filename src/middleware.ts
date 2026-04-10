import { defineMiddleware } from "astro:middleware";

/**
 * Middleware — runs as Vercel Edge Middleware (before filesystem):
 *   1. Host-based routing for custom domains (nbanow.app, showswipe.app)
 *   2. HTTP Basic Auth gate for private routes (/money, /api/money)
 */

const PROTECTED_PREFIXES = ['/money', '/api/money'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function unauthorized(): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="money", charset="UTF-8"',
    },
  });
}

export const onRequest = defineMiddleware((context, next) => {
  const host = context.request.headers.get("host") || "";
  const url = new URL(context.request.url);

  // ── Host-based routing for custom domains ──
  if (url.pathname === "/") {
    if (host.includes("nbanow.app")) {
      return context.rewrite("/nba-now");
    }
    if (host.includes("showswipe.app")) {
      return context.rewrite("/show-swipe");
    }
  }

  // ── Basic auth for private routes ──
  if (isProtected(url.pathname)) {
    const expected = import.meta.env.MONEY_PASSWORD || process.env.MONEY_PASSWORD;
    if (!expected) {
      return new Response('MONEY_PASSWORD not configured', { status: 500 });
    }

    const header = context.request.headers.get('authorization');
    if (!header || !header.toLowerCase().startsWith('basic ')) {
      return unauthorized();
    }

    let decoded: string;
    try {
      decoded = atob(header.slice(6).trim());
    } catch {
      return unauthorized();
    }

    const idx = decoded.indexOf(':');
    const password = idx >= 0 ? decoded.slice(idx + 1) : decoded;
    if (password !== expected) {
      return unauthorized();
    }
  }

  return next();
});
