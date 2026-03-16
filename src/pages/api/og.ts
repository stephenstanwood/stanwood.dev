export const prerender = false;

import type { APIRoute } from "astro";
import { ImageResponse } from "@vercel/og";
import { PAGES } from "../../lib/ogPages";

/**
 * Dynamic Open Graph image generator.
 * Usage: /api/og?page=mlb-gamerank → returns a 1200×630 PNG.
 *
 * Homepage uses a static image (public/images/og-homepage.png) instead.
 */

export const GET: APIRoute = async ({ url }) => {
  const page = url.searchParams.get("page") ?? "index";
  const config = PAGES[page];

  if (!config) {
    return new Response("Unknown page", { status: 404 });
  }

  const html = {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(135deg, ${config.bg} 0%, ${config.bg2} 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `radial-gradient(circle at 1px 1px, ${config.accent}11 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "180px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${config.accent}25 0%, transparent 70%)`,
              filter: "blur(40px)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: "96px", lineHeight: "1", marginBottom: "24px" },
            children: config.emoji,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "56px", fontWeight: 800, color: "#ffffff",
              letterSpacing: "-0.02em", lineHeight: "1.1", textAlign: "center",
              maxWidth: "900px", padding: "0 40px",
            },
            children: config.title,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "24px", fontWeight: 400, color: "rgba(255, 255, 255, 0.6)",
              marginTop: "16px", textAlign: "center", maxWidth: "700px",
              padding: "0 40px", lineHeight: "1.4",
            },
            children: config.tagline,
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute", bottom: "40px",
              display: "flex", alignItems: "center", gap: "12px",
            },
            children: [
              { type: "div", props: { style: { width: "32px", height: "3px", borderRadius: "2px", background: config.accent } } },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "16px", fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.4)",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                  },
                  children: "stanwood.dev",
                },
              },
              { type: "div", props: { style: { width: "32px", height: "3px", borderRadius: "2px", background: config.accent } } },
            ],
          },
        },
      ],
    },
  };

  return new ImageResponse(html as unknown as React.ReactElement, {
    width: 1200,
    height: 630,
  });
};
