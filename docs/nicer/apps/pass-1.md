# Apps, with the excess cut away

Stephen authorized a complete polish/revamp of the stanwood.dev app collection on October 9, 2026, followed by swrap. Direction: restore the core idea and beautiful simplicity; delete accumulated auto-improvement filler. This is an explicit full-collection pass, outside the old single-app maintenance selector.

## Scope and accepted direction

23 surfaces: the hub, Lap Lab, TL;DR, Nearest Coffee, Green Light, Museum Label, Redesign Rolodex, Which Model, AI Radar, Ship Clock, WTWTW, MLB GameRank, Driverless, Campbell, Pixel Tide, Pixel Aquarium, Show Swipe, Shop, TV, Family Room, Money, LI, ScatosSwipe. Private sign-in screens are included. The external NBA Now application, About biography, collection schedules, and unrelated refresh PRs are outside this change.

Each app retains its own character. The main action appears early; optional settings use simple disclosures. Keep complete results, preferences, keyboard access, errors and recovery. Delete repeated explanatory sections rather than relocate them into new guides. Keep the Campbell photographs, all eight tabs, official-source links and photo credits. Keep WTWTW's six restored default teams and existing preference migration. Preserve private auth, noindex, separate Scatos profiles, and saved state. No live mutation of contact or home records during QA.

## Baseline and candidate

Valid baseline screenshots and metrics: `evidence/before/website/` at 375, 768 and 1440 px. The initial home/375 image hit Vite dependency warm-up and is superseded by `evidence/before/home-recheck/`. Private LI/Scatos baseline covers the unavailable/gated state; their working views are checked with explicitly synthetic records. Screenshots and extracted private text stay gitignored.

The worst phone pages were Driverless (18,187 px), Campbell (11,889 px), Which Model (8,060 px), Lap Lab (8,034 px), and TL;DR (7,744 px). These contained introductions, scoring, duplicate examples, glossaries, and process narration before or after the tool. Money overflowed at phone/tablet widths. The hub duplicated app mini-widgets instead of serving as a clear index.

Candidate capture: `evidence/candidate/website/`; private fixture capture: `evidence/candidate-private/website/` (six valid captures at the same three widths). A temporary Vite middleware transform error during environment refresh invalidated the first candidate attempt. The server was restarted, then the capture rerun; only the rerun is the candidate evidence.

## Factual boundaries

Driverless now uses a scoped Waymo snapshot, not unsupported industry-wide fleet/safety projections. Availability checked October 9, 2026 at [Waymo rides](https://waymo.com/rides/) (15 listed serving-rider areas; Atlanta/Austin via [Uber](https://waymo.com/waymo-on-uber/)). Safety is Waymo's published comparison through June 2026, with surface-street, rider-only and operating-area limits attached: [Waymo safety impact](https://waymo.com/safety/impact/). Other providers get a source link rather than guessed availability. The retired data file remains only because older refresh jobs target it; it is no longer rendered.

Which Model provides opinionated starting picks by task, not fabricated numerical ratings, benchmark claims or stale version/pricing tables. Product capabilities checked against [Claude](https://claude.com/product/overview), [Codex](https://openai.com/codex/), [Gemini long context](https://ai.google.dev/gemini-api/docs/long-context), [ChatGPT](https://chatgpt.com/overview/), [Midjourney](https://www.midjourney.com/home), and [Mistral research](https://mistral.ai/research/).

Local verification config is isolated to this worktree. Vercel project identity verified: `stephenstanwoods-projects/stanwood-dev`. Config pull cannot return four secret values. Existing Money and Show Swipe config supports read-only live checks; LI datastore and Scatos credentials are unavailable locally, so fixtures demonstrate those authenticated UIs without touching production records. Temporary fixture pages are removed before the final production build.

## Verification ledger

Candidate: 163 unit tests across 19 files pass, including three additional recovery cases for Show Swipe. Astro check: zero errors, zero warnings; 22 unused-parameter/import hints. Build passes. The completed senior acceptance and final proof are recorded in BUILD-STATE.md and senior-acceptance.json.

Core workflow receipt: `evidence/interactions/results.json`, 19/19 pass with all external POSTs intercepted. Includes workout generation/default pace, PDF result and format, quiz persistence, image result, redesign retry, six task picks, deploy metadata, team preferences, all eight Campbell tabs and keyboard navigation, keyboard beach, aquarium play/feed/scene, trailer failure recovery, native size dialog, and synthetic LI/Scatos workflows.

Pre-finishing accessibility receipt: `evidence/accessibility-candidate/`, with affected source corrections verified in `accessibility-recheck`, `accessibility-recheck2`, and `accessibility-cold`. All 26 routes are clear of the selected Axe WCAG A/AA violations after the corrections. The completed final 26-route WCAG 2/2.1/2.2 A/AA selected-rule sweep, including the affected TV correction, has zero violations.

## Final acceptance

The senior maker accepted and froze the complete collection at 2026-10-09T22:47:38Z. Both makers are accountable (`gpt-6.1-sol` and `gpt-6-astra`; independent: false). Initial and resumed senior identities, changed paths, final pixels, all sixteen sweep dimensions, exact combined check coverage and source hashes are recorded in `senior-acceptance.json`. No actionable findings or build steps remain.

Read-only rendering and deployment authority returns to the lead for the authorized swrap. Production/PR/merge/live proof and wrap status belong in the ignored `evidence/release.json`; acceptance is not a shipping claim. Private working UI remains synthetic for LI/Scatos; physical-device testing and production performance measurements are not claimed.
