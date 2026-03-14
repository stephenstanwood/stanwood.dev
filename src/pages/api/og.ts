export const prerender = false;

import type { APIRoute } from "astro";
import { ImageResponse } from "@vercel/og";
import { PAGES } from "../../lib/ogPages";

/**
 * Dynamic Open Graph image generator.
 * Usage: /api/og?page=mlb-gamerank → returns a 1200×630 PNG.
 *
 * Each page has a pre-defined config (emoji, title, description, colors)
 * so URLs stay clean and can't be abused to render arbitrary content.
 */

function homepageLayout(config: (typeof PAGES)[string]) {
  return {
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
        // Black border frame
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "20px",
              left: "20px",
              right: "20px",
              bottom: "20px",
              border: "4px solid #111",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "40px",
            },
            children: [
              // STANWOOD.DEV label
              {
                type: "div",
                props: {
                  style: {
                    background: "#111",
                    color: "#f5df4d",
                    padding: "6px 16px",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    marginBottom: "20px",
                  },
                  children: "STANWOOD.DEV",
                },
              },
              // Name
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "72px",
                    fontWeight: 900,
                    color: "#111",
                    lineHeight: "1",
                    textAlign: "center",
                    letterSpacing: "-0.02em",
                  },
                  children: config.title,
                },
              },
              // Tagline
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "24px",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "#333",
                    marginTop: "16px",
                    textAlign: "center",
                  },
                  children: config.tagline,
                },
              },
              // Decorative dots
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "8px",
                    marginTop: "32px",
                  },
                  children: [
                    { type: "div", props: { style: { width: "10px", height: "10px", borderRadius: "50%", background: "#111" } } },
                    { type: "div", props: { style: { width: "10px", height: "10px", borderRadius: "50%", background: "#111", opacity: "0.4" } } },
                    { type: "div", props: { style: { width: "10px", height: "10px", borderRadius: "50%", background: "#111", opacity: "0.2" } } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function defaultLayout(config: (typeof PAGES)[string]) {
  return {
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
        // Subtle grid pattern overlay
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 1px 1px, ${config.accent}11 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            },
          },
        },
        // Accent glow behind emoji
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
        // Emoji
        {
          type: "div",
          props: {
            style: {
              fontSize: "96px",
              lineHeight: "1",
              marginBottom: "24px",
            },
            children: config.emoji,
          },
        },
        // Title
        {
          type: "div",
          props: {
            style: {
              fontSize: "56px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              textAlign: "center",
              maxWidth: "900px",
              padding: "0 40px",
            },
            children: config.title,
          },
        },
        // Tagline
        {
          type: "div",
          props: {
            style: {
              fontSize: "24px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.6)",
              marginTop: "16px",
              textAlign: "center",
              maxWidth: "700px",
              padding: "0 40px",
              lineHeight: "1.4",
            },
            children: config.tagline,
          },
        },
        // Bottom bar: accent line + domain
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "40px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "32px",
                    height: "3px",
                    borderRadius: "2px",
                    background: config.accent,
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.4)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  },
                  children: "stanwood.dev",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: "32px",
                    height: "3px",
                    borderRadius: "2px",
                    background: config.accent,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const GET: APIRoute = async ({ url }) => {
  const page = url.searchParams.get("page") ?? "index";
  const config = PAGES[page];

  if (!config) {
    return new Response("Unknown page", { status: 404 });
  }

  const html = config.custom ? homepageLayout(config) : defaultLayout(config);

  // Plain object trees are valid at runtime (Satori accepts them)
  // but @vercel/og types expect ReactElement, hence the cast.
  return new ImageResponse(html as unknown as React.ReactElement, {
    width: 1200,
    height: 630,
  });
};
