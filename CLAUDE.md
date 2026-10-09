# stanwood.dev

## Architecture
- Astro 5 + Vercel + React + Tailwind v4
- Shared layout: `src/layouts/BaseLayout.astro`
- Shared sports engine: `src/lib/sportsCore.ts` + `src/styles/sports.css`
- ESPN API integration for MLB GameRank
- Mix of apps, games, and tools across pages
- Retro zine homepage: cream bg, pixel borders, Space Mono / Cabin / Permanent Marker fonts
- Private LinkedIn tracker: `/li`, gated by `LI_PASSWORD`, with state in
  `LINKEDIN_TRACKER_DATABASE_URL`. Never commit contact exports or normalized
  person rows here; source and ingestion stay in the private `stoa.works` repo.
- Private pages (noindex + excluded from the sitemap in `astro.config.mjs`):
  `/tv` (personal queue dashboard — Stanford queue, around-the-internet, sports
  rails), `/familyroom` (family room TV homepage, runs fullscreen on the Mac Mini
  wired to the Samsung Q80C), `/money`, `/li`, `/lg`. `/office` 301s to `/tv`.

- Private ScatosSwip house browsing: `/lg`, signed household profiles with
  `SCATOS_PASSWORD`, state in `SCATOS_DATABASE_URL` (`scatosswip` schema).
  School-first data collection and native Mini setup: `scripts/scatosswip/README.md`.
  No public tile, ExploreMore footer, analytics, or sitemap entry for this app.

## Rules
- NBA Now links to https://nbanow.app (external) — leave NBA Now page alone
- See `.claude/projects/*/memory/nbanow-sync.md` for nbanow.app sync instructions
- Project pages get the "more from stanwood.dev" footer band via `src/components/ExploreMore.astro` (rendered by BaseLayout). New project pages: add entries to its TILES + RELATED maps.

## Scheduled jobs (run on Mac Mini)
- `dev.stanwood.scatosswip-refresh` (launchd, 4:45 AM Pacific) — official LGHS boundary first, then live listing collection and atomic publication to private Postgres. Installed at `~/.local/share/scatosswip`; verify `~/.local/state/scatosswip/latest-run.json`. No daily git commits.
- `dev.stanwood.big-inning-sync` (launchd, 3:15 AM PT) — scrapes MLB Big Inning schedule via puppeteer, rewrites `src/data/bigInningSchedule.ts`, commits + pushes if changed. Script: `~/scripts/big-inning-sync/sync.mjs` on Mini. Page is Salesforce Lightning so curl doesn't work — needs a real browser.

## Scheduled tasks (run via Claude desktop app on the laptop)
- Driverless maintenance: the current page renders `src/data/driverless/guide.ts` through `src/components/driverless/DriverlessDashboard.tsx`. Maintain its concise, sourced and dated Waymo availability/safety snapshot, including comparison limits. The old `src/data/driverless/data.ts` is no longer rendered; do not restore retired dashboard panels. Any refresh should open a sourced PR for review (no auto-merge).
