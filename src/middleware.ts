import { defineMiddleware } from "astro:middleware";
import { hashPassword, timingSafeEqual } from "./lib/auth";

/**
 * Middleware — runs as Vercel Edge Middleware (before filesystem):
 *   1. Host-based routing for custom domains (nbanow.app, showswipe.app)
 *   2. Cookie auth gate for private routes (/money, /api/money)
 */

const PROTECTED_PREFIXES = ['/money', '/api/money'];
const LOGIN_PATH = '/money-login';

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

// Hash once per cold start — MONEY_PASSWORD is fixed at deploy time
const password = import.meta.env.MONEY_PASSWORD || process.env.MONEY_PASSWORD;
const expectedTokenPromise = password ? hashPassword(password) : null;

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // ── Host-based routing for custom domains ──
  if (url.pathname === "/") {
    const host = context.request.headers.get("host") || "";
    if (host.includes("nbanow.app")) {
      return context.rewrite("/nba-now");
    }
    if (host.includes("showswipe.app")) {
      return context.rewrite("/show-swipe");
    }
  }

  // ── Cookie auth for private routes ──
  if (isProtected(url.pathname)) {
    if (!expectedTokenPromise) {
      return new Response('MONEY_PASSWORD not configured', { status: 500 });
    }

    const expectedToken = await expectedTokenPromise;
    const cookies = context.request.headers.get('cookie') || '';
    const match = cookies.split(';').find((c) => c.trim().startsWith('money_session='));
    const token = match ? match.split('=')[1].trim() : null;

    if (!token || !timingSafeEqual(token, expectedToken)) {
      if (url.pathname.startsWith('/api/')) {
        return new Response('Unauthorized', { status: 401 });
      }
      return Response.redirect(new URL(LOGIN_PATH, url.origin), 302);
    }
  }

  return next();
});
