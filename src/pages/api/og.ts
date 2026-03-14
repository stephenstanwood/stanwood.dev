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

function buildIndexCard(config: (typeof PAGES)[string]) {
  // Retro zine style matching the homepage aesthetic
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f5f0e8",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        padding: "0",
      },
      children: [
        // Top black bar (like the ticker)
        {
          type: "div",
          props: {
            style: {
              width: "100%",
              background: "#111",
              padding: "14px 60px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: "#fbbf24",
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  },
                  children: "stanwood.dev",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#fbbf24",
                    fontSize: "12px",
                    opacity: "0.4",
                  },
                  children: "\u25C6",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#fbbf24",
                    fontSize: "13px",
                    letterSpacing: "0.05em",
                    opacity: "0.7",
                  },
                  children: "building tools to make life simpler & more fun",
                },
              },
            ],
          },
        },
        // Main content area
        {
          type: "div",
          props: {
            style: {
              flex: "1",
              display: "flex",
              padding: "48px 60px",
              gap: "48px",
            },
            children: [
              // Left: identity block (yellow card)
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    flex: "1",
                  },
                  children: [
                    // Yellow card
                    {
                      type: "div",
                      props: {
                        style: {
                          background: "#fbbf24",
                          border: "3px solid #111",
                          boxShadow: "8px 8px 0 #111",
                          padding: "36px 40px",
                          display: "flex",
                          flexDirection: "column",
                        },
                        children: [
                          // Stamp
                          {
                            type: "div",
                            props: {
                              style: {
                                background: "#111",
                                color: "#fbbf24",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                padding: "4px 10px",
                                display: "flex",
                                alignSelf: "flex-start",
                                marginBottom: "16px",
                              },
                              children: "stanwood.dev",
                            },
                          },
                          // Name
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "64px",
                                fontWeight: 900,
                                color: "#111",
                                lineHeight: "1.0",
                                letterSpacing: "-2px",
                                marginBottom: "12px",
                              },
                              children: "Stephen Stanwood",
                            },
                          },
                          // Tagline
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "20px",
                                fontStyle: "italic",
                                color: "#333",
                                lineHeight: "1.4",
                              },
                              children: config.tagline,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Right: project grid mockup
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    justifyContent: "center",
                    width: "340px",
                    flexShrink: "0",
                  },
                  children: [
                    // Row of mini project tiles
                    ...[
                      ["\u{1F3C0}", "NBA Now"],
                      ["\u{1F37F}", "Show Swipe"],
                      ["\u26BE", "MLB GameRank"],
                      ["\u{1FA9F}", "Kid Window"],
                      ["\u{1F3CA}", "Lap Lab"],
                      ["\u2615", "Nearest Coffee"],
                    ].map(([emoji, name]) => ({
                      type: "div",
                      props: {
                        style: {
                          background: "#fff",
                          border: "2px solid #111",
                          boxShadow: "3px 3px 0 #111",
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { fontSize: "24px" },
                              children: emoji,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "#111",
                              },
                              children: name,
                            },
                          },
                        ],
                      },
                    })),
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

function buildDefaultCard(config: (typeof PAGES)[string]) {
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

  const html = page === "index" ? buildIndexCard(config) : buildDefaultCard(config);

  // Plain object trees are valid at runtime (Satori accepts them)
  // but @vercel/og types expect ReactElement, hence the cast.
  return new ImageResponse(html as unknown as React.ReactElement, {
    width: 1200,
    height: 630,
  });
};
