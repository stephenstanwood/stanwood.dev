import { defineMiddleware } from "astro:middleware";
import { hashPassword, timingSafeEqual } from "./lib/auth";

/**
 * Middleware — runs as Vercel Edge Middleware (before filesystem):
 *   1. Host-based routing for custom domains (nbanow.app, showswipe.app)
 *   2. Cookie auth gates for private tools (/money and /li)
 */

interface PrivateGate {
  prefixes: string[];
  loginPath: string;
  cookieName: string;
  password: string | undefined;
  missingMessage: string;
}

const privateGates: PrivateGate[] = [
  {
    prefixes: ['/money', '/api/money'],
    loginPath: '/money-login',
    cookieName: 'money_session',
    password: import.meta.env.MONEY_PASSWORD || process.env.MONEY_PASSWORD,
    missingMessage: 'MONEY_PASSWORD not configured',
  },
  {
    prefixes: ['/li', '/api/li'],
    loginPath: '/li-login',
    cookieName: 'li_session',
    password: import.meta.env.LI_PASSWORD || process.env.LI_PASSWORD,
    missingMessage: 'LI_PASSWORD not configured',
  },
];

function gateForPath(pathname: string): PrivateGate | undefined {
  return privateGates.find((gate) =>
    gate.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/')),
  );
}

// Hash once per cold start; private-tool passwords are fixed at deploy time.
const expectedTokens = new Map(
  privateGates.map((gate) => [gate.cookieName, gate.password ? hashPassword(gate.password) : null]),
);

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // ── Host-based routing for custom domains ──
  // Skip during prerender: in production, Vercel postbuild rewrites handle
  // this before the filesystem handler (see scripts/postbuild.mjs). This guard
  // only runs at request time (dev mode), avoiding a build-time header warning.
  if (url.pathname === "/" && !context.isPrerendered) {
    const host = context.request.headers.get("host") || "";
    if (host.includes("nbanow.app")) {
      return context.rewrite("/nba-now");
    }
    if (host.includes("showswipe.app")) {
      return context.rewrite("/show-swipe");
    }
  }

  // ── Cookie auth for private routes ──
  const gate = gateForPath(url.pathname);
  if (gate) {
    const expectedTokenPromise = expectedTokens.get(gate.cookieName);
    if (!expectedTokenPromise) {
      return new Response(gate.missingMessage, { status: 500 });
    }

    const expectedToken = await expectedTokenPromise;
    const cookies = context.request.headers.get('cookie') || '';
    const match = cookies
      .split(';')
      .find((cookie) => cookie.trim().startsWith(`${gate.cookieName}=`));
    const token = match ? match.split('=')[1].trim() : null;

    if (!token || !timingSafeEqual(token, expectedToken)) {
      if (url.pathname.startsWith('/api/')) {
        return new Response('Unauthorized', { status: 401 });
      }
      return Response.redirect(new URL(gate.loginPath, url.origin), 302);
    }
  }

  return next();
});
