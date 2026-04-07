import { defineMiddleware } from "astro:middleware";

/**
 * Host-based routing for custom domains.
 * Runs as Vercel Edge Middleware (before filesystem) so it can
 * rewrite the root path to the correct app page.
 */
export const onRequest = defineMiddleware((context, next) => {
  const host = context.request.headers.get("host") || "";
  const url = new URL(context.request.url);

  if (url.pathname === "/") {
    if (host.includes("nbanow.app")) {
      return context.rewrite("/nba-now");
    }
    if (host.includes("showswipe.app")) {
      return context.rewrite("/show-swipe");
    }
  }

  return next();
});
