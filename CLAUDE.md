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
- Project pages get the "more from stanwood.dev" footer band via `src/components/ExploreMore.astro` (rendered by BaseLayout). New project pages: add entries to its TILES + RELATED maps.

## Scheduled jobs (run on Mac Mini)
- `dev.stanwood.big-inning-sync` (launchd, 3:15 AM PT) — scrapes MLB Big Inning schedule via puppeteer, rewrites `src/data/bigInningSchedule.ts`, commits + pushes if changed. Script: `~/scripts/big-inning-sync/sync.mjs` on Mini. Page is Salesforce Lightning so curl doesn't work — needs a real browser.

## Scheduled tasks (run via Claude desktop app on the laptop)
- `driverless-monthly-refresh` (1st of month, 2:30 AM PT) — researches current US AV stats from primary sources, updates `src/data/driverless/data.ts` + dated labels in `src/components/driverless/`, opens a sourced PR for review (no auto-merge). Task prompt: `~/.claude/scheduled-tasks/driverless-monthly-refresh/SKILL.md`.
