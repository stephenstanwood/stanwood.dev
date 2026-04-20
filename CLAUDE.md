# stanwood.dev

## Architecture
- Astro 5 + Vercel + React + Tailwind v4
- Shared layout: `src/layouts/BaseLayout.astro`
- Shared sports engine: `src/lib/sportsCore.ts` + `src/styles/sports.css`
- ESPN API integration for MLB GameRank
- Mix of apps, games, and tools across pages
- Retro zine homepage: cream bg, pixel borders, Space Mono / Cabin / Permanent Marker fonts
- `/youtube` "Around the Internet" podcast feed is served from the Mac Mini via Tailscale Funnel: `https://stephens-mac-mini.tailcac25b.ts.net:8443/aroundtheinternet/feed.xml` (public, no tailnet required). Stanford-only feed at `/stanford/feed.xml` on the same host.

## Rules
- NBA Now links to https://nbanow.app (external) — leave NBA Now page alone
- See `.claude/projects/*/memory/nbanow-sync.md` for nbanow.app sync instructions
