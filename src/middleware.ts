import { defineMiddleware } from "astro:middleware";
import { hashPassword, readCookie, timingSafeEqual } from "./lib/auth";
import { getSession } from "./lib/scatos/auth";

/**
 * Middleware — runs as Vercel Edge Middleware (before filesystem):
 *   1. Host-based routing for custom domains (nbanow.app, showswipe.app)
 *   2. Cookie auth gates for private tools (/money, /li, and /lg)
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
    prefixes: ["/money", "/api/money"],
    loginPath: "/money-login",
    cookieName: "money_session",
    password: import.meta.env.MONEY_PASSWORD || process.env.MONEY_PASSWORD,
    missingMessage: "MONEY_PASSWORD not configured",
  },
  {
    prefixes: ["/li", "/api/li"],
    loginPath: "/li-login",
    cookieName: "li_session",
    password: import.meta.env.LI_PASSWORD || process.env.LI_PASSWORD,
    missingMessage: "LI_PASSWORD not configured",
  },
];

/** True when `pathname` is one of `prefixes` or sits underneath one of them. */
function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function gateForPath(pathname: string): PrivateGate | undefined {
  return privateGates.find((gate) => matchesPrefix(pathname, gate.prefixes));
}

// Sign-in and sign-out must stay reachable without a session.
const SCATOS_PREFIXES = ["/lg", "/api/lg"];
const SCATOS_PUBLIC_PREFIXES = ["/lg/login", "/lg/logout"];
const SCATOS_CACHE_CONTROL = "private, no-store";

// Hash once per cold start; private-tool passwords are fixed at deploy time.
const expectedTokens = new Map(
  privateGates.map((gate) => [gate.cookieName, gate.password ? hashPassword(gate.password) : null]),
);

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // ScatosSwip has its own signed session, so it gates ahead of the password
  // table above and adds no-store/noindex headers to everything it serves.
  if (matchesPrefix(url.pathname, SCATOS_PREFIXES)) {
    const isPublicScatosPath = matchesPrefix(url.pathname, SCATOS_PUBLIC_PREFIXES);
    if (!isPublicScatosPath && !(await getSession(context.request))) {
      if (url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "Please sign in again." }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Cache-Control": SCATOS_CACHE_CONTROL },
        });
      }
      return new Response(null, {
        status: 302,
        headers: { Location: "/lg/login", "Cache-Control": SCATOS_CACHE_CONTROL },
      });
    }
    const response = await next();
    response.headers.set("Cache-Control", SCATOS_CACHE_CONTROL);
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

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
    const token = readCookie(context.request.headers.get("cookie"), gate.cookieName);

    if (!token || !timingSafeEqual(token, expectedToken)) {
      if (url.pathname.startsWith("/api/")) {
        return new Response("Unauthorized", { status: 401 });
      }
      return Response.redirect(new URL(gate.loginPath, url.origin), 302);
    }
  }

  return next();
});
