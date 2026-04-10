import { defineMiddleware } from "astro:middleware";

/**
 * Middleware — runs as Vercel Edge Middleware (before filesystem):
 *   1. Host-based routing for custom domains (nbanow.app, showswipe.app)
 *   2. HTTP Basic Auth gate for private routes (/money, /api/money)
 */

const PROTECTED_PREFIXES = ['/money', '/api/money'];
const LOGIN_PATH = '/money-login';

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
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

  // ── Cookie auth for private routes ──
  if (isProtected(url.pathname)) {
    const expected = import.meta.env.MONEY_PASSWORD || process.env.MONEY_PASSWORD;
    if (!expected) {
      return new Response('MONEY_PASSWORD not configured', { status: 500 });
    }

    const cookies = context.request.headers.get('cookie') || '';
    const match = cookies.split(';').find((c) => c.trim().startsWith('money_session='));
    const token = match ? match.split('=')[1].trim() : null;

    if (token !== expected) {
      // API routes return 401; page routes redirect to login
      if (url.pathname.startsWith('/api/')) {
        return new Response('Unauthorized', { status: 401 });
      }
      return Response.redirect(new URL(LOGIN_PATH, url.origin), 302);
    }
  }

  return next();
});
