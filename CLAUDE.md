# stanwood.dev

## Architecture
- Astro 5 + Vercel + React + Tailwind v4
- Shared layout: `src/layouts/BaseLayout.astro`
- Shared sports engine: `src/lib/sportsCore.ts` + `src/styles/sports.css`
- ESPN API integration for MLB GameRank
- Mix of apps, games, and tools across pages
- Retro zine homepage: cream bg, pixel borders, Space Mono / Cabin / Permanent Marker fonts

## Rules
- NBA Now links to https://nbanow.app (external) — leave NBA Now page alone
- See `.claude/projects/*/memory/nbanow-sync.md` for nbanow.app sync instructions

## Scheduled jobs (run on Mac Mini)
- `dev.stanwood.big-inning-sync` (launchd, 3:15 AM PT) — scrapes MLB Big Inning schedule via puppeteer, rewrites `src/data/bigInningSchedule.ts`, commits + pushes if changed. Script: `~/scripts/big-inning-sync/sync.mjs` on Mini. Page is Salesforce Lightning so curl doesn't work — needs a real browser.
