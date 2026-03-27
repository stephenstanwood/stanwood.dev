# Iteration Log

---

## Cycle 12 — 2026-03-27

**Site worked on:** stanwood.dev

**Ideas considered:**

stanwood.dev:
1. **Add Idea Shuffler to homepage grid** — flagged 4+ consecutive cycles as overdue; tile image exists, page is complete, just invisible ← CHOSE THIS
2. "Just shipped" strip freshness — entries are from Feb/Mar '26
3. stoa.works — "Why Stoa?" section could add supporting specifics (timeline expectations, budget framing)

stoa.works:
1. "Why Stoa?" could use supporting evidence (outcome metrics, timelines)
2. Stoa logo mark — still text-only
3. Portfolio pages — more project pages could get case study sections

**What changed:** Added Idea Shuffler to the Weird & Useful section on the stanwood.dev homepage.
- Added a new `proj-row--four` CSS variant using `grid-template-columns: repeat(4, 1fr)` (vs the standard 6-column layout), applied at both desktop and tablet breakpoints to avoid orphaned tile
- Added `{ href: "/idea-shuffler", emoji: "🔀", name: "Idea Shuffler", tag: "browse your ideas without ranking them", image: "/images/idea-shuffler.webp" }` to the `weirdAndUseful` array
- Bumped terminal project counter from `17 and counting` → `18 and counting`

**Why highest-leverage:**
- Idea Shuffler was a fully-built tool that no visitor could discover. Adding it to the grid makes it discoverable without any other changes — highest-leverage/lowest-effort ratio.
- It had been the #1 deferred stanwood.dev item for multiple cycles, blocked only by the orphan layout concern. The 4-tile layout variant resolves that cleanly.
- Four equally-sized tiles in the Weird & Useful section actually looks better than 3 — fills the row, more balanced.
- Lens: information architecture / product discoverability (last applied to stanwood.dev in Cycle 3 — appropriate rotation).

**Up next (strongest ideas still on deck):**
1. stanwood.dev — "Just shipped" strip freshness: still showing Feb/Mar '26 entries. With 18 projects now, worth adding a newer entry or updating the strip signal.
2. stoa.works — "Why Stoa?" supporting evidence: the pillars are strong but abstract. A single specific outcome per pillar (e.g., a deployment stat, an agency name, a time-to-ship number) would make them concrete and trust-building.
3. stoa.works — Stoa logo mark: still text-only. A simple mark would help recognition in proposal/email contexts.

---

## Cycle 11 — 2026-03-27

**Site worked on:** stoa.works

**Ideas considered:**

stoa.works:
1. **Portfolio page case study narratives** — each page is just header + demo, no story ← CHOSE THIS (flagged in top 3 for 5+ consecutive cycles)
2. Stoa logo mark — still text-only
3. stanwood.dev "just shipped" strip freshness — Feb/Mar entries could be refreshed

stanwood.dev:
1. Idea Shuffler still not on the grid (orphan concern previously, but 4 tiles in a row is valid)
2. "Just shipped" strip freshness
3. About page — no photo (blocked by asset)

**What changed:** Added consistent "The problem / The approach / Why it matters" case study sections to the three most bare stoa.works portfolio pages:
- `budget-dashboard.astro` — previously just a back link + component. Now has a proper header, tech tags, and 3-panel case study.
- `campbell-portal.astro` — previously just a breadcrumb bar + full component. Now has header, project description, and case study including the "ROI for city staff" framing.
- `cpsc-recalls.astro` — had a decent header but no narrative. Now has the case study between header and demo.

Each case study covers:
- **The problem** — specific, grounded, not generic (e.g., "multi-hundred-page PDFs that technically meet the transparency requirement")
- **The approach** — how it was built and why those choices made sense
- **Why it matters** — the operational benefit for agencies (FOIA burden, staff time, call deflection) — the kind of ROI framing a city manager or procurement officer needs

**Why highest-leverage:**
- Portfolio case studies have been the #1 unchecked stoa.works item for 5+ consecutive cycles. Every prior cycle had something more urgent. Now there was no clear blocker.
- A government client clicking through a portfolio card and seeing just a header + component has zero context to evaluate fit. The case study sections give them: (a) problem recognition, (b) technical credibility, (c) operational benefit language they can use internally to justify the engagement.
- Lens: portfolio storytelling/conversion (distinct from Cycle 10's copy/positioning lens on the hero).
- The "why it matters" sections are intentionally written in agency ROI language — not "this is cool" but "here's what this does for your staff and budget."

**Up next (strongest ideas still on deck):**
1. stanwood.dev — Idea Shuffler still not on the grid. Originally blocked by "orphan tile" concern, but 4 tiles in Weird & Useful fills a row cleanly. Worth revisiting.
2. stoa.works — Stoa logo mark. Still text-only. Even a simple mark (stylized S or civic symbol) would help recognition in email context, proposals, etc.
3. stanwood.dev — "Just shipped" strip freshness. Kid Window and Museum Label are Feb '26. Could add a newer entry or refresh the framing.

---

## Cycle 10 — 2026-03-27

**Site worked on:** stoa.works

**Ideas considered:**

stoa.works:
1. **Rewrite hero — lead with insider differentiator** ← CHOSE THIS (flagged in top 3 for 4 consecutive cycles)
2. Portfolio individual pages lack case-study depth — just a header + live demo, no narrative
3. Stoa logo mark — still text-only

stanwood.dev:
1. "Just shipped" strip is slightly stale — entries from Feb/Mar '26, no March or later entries
2. Technology section only has 2 real tiles + terminal — could add a 3rd tool
3. About page still has no photo

**What changed:** Rewrote the hero section on stoa.works — both the headline and the subtext.

Before:
- Headline: "Software that helps government serve people better."
- Sub: "We build citizen-facing tools and internal software for state & local agencies. Small team, fast delivery, no nonsense."

After:
- Headline: "Government software built by someone inside government."
- Sub: "Citizen-facing tools, open data, and AI search for state and local agencies. The founder works in the federal government — no onboarding required on how procurement works, why the last portal failed, or what residents actually need."

**Why highest-leverage:**
- The hero is the first thing every visitor reads. The old headline ("Software that helps government serve people better.") was accurate but generic — any B2B gov-tech company could write it. The new headline opens with Stoa's single most differentiating fact: the founder is *inside* government.
- "Small team, fast delivery, no nonsense" was generic freelancer copy. The new sub immediately answers the implicit question every potential client has: "Do these people understand government from the inside?" — and it does so in concrete terms (procurement, portal failures, resident needs).
- This has been the top outstanding stoa.works item for 4 consecutive cycles (cycles 7, 8, 9 all listed it as #1 or #2 next move).
- Rotation: Cycle 9 was stanwood.dev (UX/interaction fix). This cycle: stoa.works, copy/positioning lens (last applied to stoa.works in Cycle 2 — fully appropriate rotation).

**Up next (strongest ideas still on deck):**
1. stoa.works — Portfolio individual pages lack narrative. Each page is just a header + live demo. Adding a 2–3 paragraph case study (problem, approach, outcome) would dramatically improve conversion for government clients who click through to evaluate.
2. stanwood.dev — "Just shipped" strip freshness: still showing Feb–Mar '26 entries. Worth refreshing or considering if a newer entry should be added.
3. stoa.works — Stoa logo mark: still text-only. A simple mark would help recognition, especially if Stoa starts appearing in other contexts.

---

## Cycle 9 — 2026-03-27

**Site worked on:** stanwood.dev

**Ideas considered:**

stanwood.dev:
1. **Fix AI Radar 2-second fake loading delay** — static JSON data was being artificially hidden behind a 2000ms setTimeout + animation ← CHOSE THIS (4 cycles overdue)
2. Update "just shipped" strip to refresh entries (current entries are from Feb/Mar '26, still relevant)
3. Featured card tag audit — "Sports · Live" tag on NBA Now is generic

stoa.works:
1. Hero subtext tightening — remaining generic freelancer copy
2. Stoa logo mark — still text-only
3. Amplify founder credibility higher in the page flow

**What changed:** Removed the 2-second artificial loading delay from `AIRadarTile.tsx`. The component previously initialized `ready = false` and used a `setTimeout(() => setReady(true), 2000)` to show a radar animation before revealing the entry list. Since the data is static JSON (no network fetch), this delay served no purpose — it just made the tile appear broken for 2 full seconds on every page load. Now the entries render immediately (`radar-list--visible` always active, `useState`/`useEffect` removed entirely).

**Why highest-leverage:**
- This bug was the #1 outstanding stanwood.dev item for 4 consecutive cycles — clearly the right move.
- Every visitor sees the AI Radar tile in a broken/loading state for 2 full seconds. A visitor with a fast connection or returning to the page sees the spinning animation before seeing any content, which reads as "this is loading from the network" when it's actually instant static data.
- The tile is one of the most compelling on the grid (live AI news, clear utility). A 2-second blank state undercuts that value.
- Zero design change — same radar aesthetic, same header, same blinking dot. Just content appears immediately.
- Lens: interaction/UX fix (first time this lens has been applied to stanwood.dev — prior cycles were info arch, delight/content, and copy).

**Up next (strongest ideas still on deck):**
1. stoa.works — Hero/positioning copy: the remaining generic language ("Small team, fast delivery") — sharpen to reinforce the insider/government angle more specifically.
2. stanwood.dev — "just shipped" strip freshness: currently shows Feb/Mar entries; consider adding a newer entry as more tools ship.
3. stoa.works — Stoa logo mark: text-only still. A simple mark would help recognition, especially if Stoa starts appearing in other contexts (emails, proposals).

---

## Cycle 8 — 2026-03-26

**Site worked on:** stoa.works

**Ideas considered:**

stoa.works:
1. **Portfolio card outcome signals** — replace generic "Live demo" with concrete per-project meta ← CHOSE THIS (4 consecutive cycles overdue)
2. Hero subtext tightening — "Small team, fast delivery, no nonsense" is generic
3. Stoa logo mark — text-only currently

stanwood.dev:
1. AI Radar loading bug — possible visible loading state on first render
2. About page — no photo, feels impersonal
3. Grid section headers — could be more distinctive

**What changed:** Replaced the generic "Live demo" label on each portfolio card with a specific, concrete outcome signal:
- CPSC Recall Search: "Federal data · 500K+ records"
- City of Campbell Portal: "City of Campbell, CA"
- 311 Service Requests: "Municipal · Real-time tracking"
- Bay Area Budget Dashboard: "6 Bay Area cities · FY 2024"
- Council Minutes Search: "Real Legistar data · 7+ councils"
- Parks & Facilities Map: "Geolocation · Live map"

Also bumped the meta text color from slate-400 to slate-500 for slightly better legibility.

**Why highest-leverage:**
- This change has been the #1 overdue item for 4 consecutive cycles — clearly the right move.
- "Live demo" told a government client nothing. Each meta now answers two implicit questions: "Is this real data or made up?" and "What's the scope?"
- The CPSC card now signals it's backed by actual federal data (500K+ records) — not a mockup. The council minutes card surfaces that it uses real Legistar API data covering 7+ real councils. These are proof signals, not marketing copy.
- A government procurement contact scanning the portfolio can now immediately triage which tools are closest to what they need.
- Zero visual disruption — same card layout, same strip. Just more signal in the same space.
- Lens: portfolio storytelling (first time this lens has been applied to stoa.works).

**Up next (strongest ideas still on deck):**
1. stanwood.dev — AI Radar loading bug: may show a visible "loading..." state on first render. Investigate and fix.
2. stoa.works — Hero subtext: "Small team, fast delivery, no nonsense" reads as generic freelancer copy. Sharpen to something more specific to Stoa's insider position.
3. stanwood.dev — About page: no photo. Even a casual shot would make the page feel real rather than placeholder.

---

## Cycle 7 — 2026-03-26

**Site worked on:** stanwood.dev

**Ideas considered:**

stanwood.dev:
1. **Tile tag sweep — rewrite the 4 weakest grid tags** ← CHOSE THIS
2. AI Radar loading bug — possible visible bug on first render
3. Homepage identity block / tagline — re-examine for clarity

stoa.works:
1. Portfolio card outcomes — add one concrete signal per card (timeline, agency type, live status)
2. Stoa logo mark — currently text-only; a simple mark would help recognition
3. Hero subtext tightening — "Small team, fast delivery, no nonsense" is decent but could be sharper

**What changed:** Rewrote the 4 weakest tile tags on the stanwood.dev homepage grid:
- Green Light: "know what to order" → "taste quiz → menu picks" (was bafflingly vague; now shows the input/output mechanism using the arrow format)
- Redesign Rolodex: "alternate-universe redesigns" → "redesign concepts for any website" (was evocative but said nothing about what the tool does; now tells you the output and the scope)
- Campbell, CA: "one-stop shop for our city" → "city services, events & permits" (was generic marketing speak; now specific and scannable)
- Driverless Cars: "stats on self-driving vehicles" → "self-driving, by the numbers" (was inert and dry; now has a bit of editorial personality while staying clear)

**Why highest-leverage:**
- Tile tags are the only copy visible when scanning the grid — they are the sole click driver for 14+ projects. If a tag is confusing, the tool doesn't get clicked, period.
- "Know what to order" was the single most confusing tag — Green Light is a taste quiz that gives you personalized restaurant menu picks. Nothing in the old tag communicated that.
- "Alternate-universe redesigns" sounded cool but had no informational value — visitors couldn't tell if it was a gallery, an AI tool, a game, or something else.
- Fixing 4 at once is meaningful scope — not a one-word tweak.
- Rotation: last cycle was stoa.works (conversion/info arch). This cycle: stanwood.dev, copy/click-through lens.

**Up next (strongest ideas still on deck):**
1. stoa.works — Portfolio card outcomes: add one concrete signal per card (deployed agency, timeline, live status). The portfolio is visually strong but lacks proof. This has been in the top 3 for 4 consecutive cycles — time to do it.
2. stanwood.dev — AI Radar loading bug: the component may show a "loading..." state on first render visible to users. Worth investigating and fixing.
3. stoa.works — Hero subtext: "Small team, fast delivery, no nonsense" is a bit generic for a site that has otherwise developed strong, specific positioning. Could be tightened to reinforce the insider angle.

---

## Cycle 6 — 2026-03-26

**Site worked on:** stoa.works

**Ideas considered:**

stoa.works:
1. **"How it works" process section** — 3-step engagement model (Brief us → Scope together → Build and ship) between services and portfolio ← CHOSE THIS
2. Portfolio card outcome signals — deployment/live status per card
3. "What we do" services strip visual upgrade (addressed partially — added section heading, renamed to "What we build")

stanwood.dev:
1. Section tagline rewrites for better click-through
2. AI Radar "loading..." state investigation
3. About page improvement (no photo)

**What changed:** Added a new "How it works" section between "What we build" and "Portfolio" on stoa.works. Three numbered steps (01 / 02 / 03) in a centered horizontal grid with a connecting hairline on desktop. Steps: Brief us (no RFP needed), Scope together (one call, fixed scope/price), Build and ship (tight sprints, clean handoff, you own the code). Section ends with a CTA button linking to the contact section. Also renamed "What we do" → "What we build" and added a proper `h2` section heading to that previously headerless services strip.

**Why highest-leverage:**
- "How it works" has been the #1 pending stoa.works item for 3 consecutive cycles — clearly the right move.
- The site explained why to choose Stoa and what they build, but had zero answer to "how do I actually engage you?" — a critical question for procurement-minded clients.
- Government clients in particular need to understand the engagement model before they're willing to reach out. This removes a friction point between "this looks good" and "send email."
- The lens this cycle: conversion / information architecture (new to this rotation; prior cycles covered trust, copy, and contact section redesign).

**Up next (strongest ideas still on deck):**
1. stoa.works — Portfolio card outcomes: add one concrete signal per card (timeline, agency type, live status). The portfolio is strong visually but lacks proof.
2. stanwood.dev — Section tagline rewrites: "know what to order" for Green Light is too vague; several tiles undersell their tools. Higher click-through potential.
3. stanwood.dev — AI Radar "loading..." issue: the WebFetch detected a loading state that may be an actual bug visible on first render.

---

## Cycle 5 — 2026-03-26

**Site worked on:** stanwood.dev

**Ideas considered:**

stanwood.dev:
1. **Add "recently shipped" activity strip to homepage** — a full-width bulletin row between the identity block and featured section, showing the 3 most recently shipped tools with dates ← CHOSE THIS
2. "NEW" badge on the Vibe Check tile only — too small / anti-fiddling rule
3. Rewrite section tag lines to be more evocative and click-inducing

stoa.works:
1. "How it works" process section — 3-step engagement model for procurement-minded clients
2. Portfolio card outcome signals — deployment/live status per card
3. Tighten the "What we do" strip — it has no section header and is visually weak

**What changed:** Added a "just shipped" horizontal strip to stanwood.dev homepage (desktop only, hidden on mobile). Positioned between the identity/header block row and the "⭐ featured" section. Three entries in a row: Vibe Check (Mar '26), Museum Label (Feb '26), Kid Window (Feb '26). Dark left label ("just shipped" with a blinking green dot) against a white background with pixel border. Each entry shows tool name, short description, and date. Hover turns the entry yellow. CSS uses the same monospace/Space Mono conventions as the rest of the site.

**Why highest-leverage:**
- The "recently shipped" signal has appeared as a top idea in every single cycle (1–4) without ever being executed. This was the clearest overdue item.
- A new homepage section is architecturally meaningful — not a badge on one tile.
- Return visitors now have a visible "what's new?" scan target at the top of the page. First-time visitors get an immediate signal that the site is alive and actively shipping.
- Fits the terminal/zine aesthetic exactly: monospace, pixel borders, blinking dot.
- Rotation: cycles 1/2/4 were stoa.works. Cycle 3 was stanwood.dev info architecture. This cycle: stanwood.dev delight/trust.

**Up next (strongest ideas still on deck):**
1. stoa.works — "How it works" process section: 3-step engagement model between Why Stoa? and Portfolio. Procurement-minded clients want to understand the engagement model. This has been in the top 3 for 3 consecutive cycles.
2. stoa.works — "What we do" services strip has no section header and is visually weak — sandwiched and easy to miss.
3. stanwood.dev — Rewrite section tag lines across the grid to be more evocative. "know what to order" for Green Light is too vague; "alternate-universe redesigns" for Redesign Rolodex undersells it. Higher click-through potential.

---

## Cycle 4 — 2026-03-26

**Site worked on:** stoa.works

**Ideas considered:**

stoa.works:
1. **Upgrade contact section to proper intake experience** — "good fits" list + framed card + response time signal ← CHOSE THIS
2. Portfolio card outcome signals — add deployment/live status per card
3. Add a process/timeline section — 3-step "how it works" for procurement-minded clients

stanwood.dev:
1. Add Idea Shuffler to the grid (needs a companion tile to avoid orphan)
2. "Recently shipped" badge on newest tiles
3. Explore restructuring Weird & Useful to accommodate Idea Shuffler

**What changed:** Transformed the contact section on stoa.works from a bare email link into a proper two-column intake experience. Left column: "Good fits" list with 4 specific project types (citizen-facing tools, open data/transparency, AI search, accessibility retrofits). Right column: framed white card with a prominent email button, "Typically respond within one business day" signal, and a secondary founder bio. Section also got a bg-stone-50 treatment to visually separate it from the portfolio.

**Why highest-leverage:**
- Lens rotation: cycles 1–2 were stoa.works trust/credibility and copy, cycle 3 was stanwood.dev info architecture. Cycle 4 returns to stoa.works with a new lens: conversion.
- The existing credibility sections (Cycle 1 founder bio, Cycle 2 Why Stoa? pillars) set up a strong case but never closed it. A government client reading the page had no idea if they were a good fit, what to say, or what to expect.
- This change answers those three questions directly and reduces friction at the moment of decision.
- A bare email link at the end of an otherwise credible page was actively undermining the work of prior cycles.

**Up next (strongest ideas still on deck):**
1. stanwood.dev — Add Idea Shuffler to the grid. Needs either a companion tile for Weird & Useful or a small restructure of that section.
2. stoa.works — Portfolio card outcomes: even one concrete signal per card ("live since X", "deployed to Y") would add weight.
3. stoa.works — "How it works" section: a 3-step process module between Why Stoa? and Portfolio would help procurement-minded clients understand the engagement model.

---

## Cycle 3 — 2026-03-26

**Site worked on:** stanwood.dev

**Ideas considered:**

stanwood.dev:
1. **Surface unlisted tools on homepage grid** — two fully-built pages (Vibe Check, Idea Shuffler) had tile images but were unreachable from the homepage ← CHOSE THIS
2. Add "NEW" badge stamps to recently-added tiles as a "recently shipped" signal
3. Add Idea Shuffler to Weird & Useful (deferred — would create orphan tile in desktop layout)

stoa.works:
1. Strengthen contact section — add intake framing, project fit signals, more purposeful CTA
2. Portfolio card outcome signals — add deployment/live status per card
3. Visual redesign of the "What we do" services strip

**What changed:** Added Vibe Check to the Technology section on stanwood.dev homepage, replacing the "have a great day 🙂" spacer tile. Technology row now has 3 real tiles: TerminalLoopTile (site uptime) + Driverless Cars + Vibe Check. Updated terminal project count from 16 → 17.

Vibe Check is a complete AI tool (paste a URL, get design critique: color palette, typography, overall energy) with a tile image already made. It was fully built but invisible — no path to it from the homepage. This change makes it discoverable.

**Why highest-leverage:**
- Previous two cycles were copy/positioning on stoa.works. This cycle rotates to stanwood.dev and a different type (information architecture / product discoverability).
- Removing the spacer filler and replacing with a real tool makes the grid feel more intentional and honest.
- A fully-built AI tool that no visitor could find is a real waste — this fix is immediate and zero-risk.

**Up next (strongest ideas still on deck):**
1. stanwood.dev — Add Idea Shuffler to the grid. Needs a companion tile to avoid a desktop orphan (Weird & Useful would have 4 items). Wait for another new tile to pair with it, or restructure section.
2. stoa.works — Strengthen contact section. Still just an email link. Add intake framing: what kinds of projects fit, what to expect, maybe a short response-time note.
3. stanwood.dev — "Recently shipped" badge on the newest tiles as a visual signal of site activity. Low-effort, fits the zine aesthetic.

---

## Cycle 2 — 2026-03-26

**Site worked on:** stoa.works

**Ideas considered:**

stoa.works:
1. **Rewrite "Why Stoa?" pillars with specific insider positioning** ← CHOSE THIS
2. Strengthen contact section — add framing about project types and intake context
3. Add outcome metrics or pull-quotes to portfolio cards to show proven results

stanwood.dev:
1. Add "recently shipped" badge or last-updated signal to show the site is active
2. Technology section has only 1 tile — either populate it or merge it into another category
3. Improve the stanwood.dev homepage featured card copy for the weaker tiles

**What changed:** Rewrote the three "Why Stoa?" pillars on stoa.works homepage. Replaced generic freelancer copy ("Ships fast", "Direct and accountable", "Citizen-first design") with three pillars grounded in Stephen's actual differentiators:
1. **No translation required** — insider knowledge means no weeks of explaining procurement, compliance, and user constraints
2. **Built to be used, not shelved** — government tech failure rate; adoption is the measure of success
3. **Law, policy, and code — one person** — no handoff, no lost context, statute to implementation

**Why highest-leverage:** The "Why Stoa?" section is read by every visitor and was doing zero persuasion work. After Cycle 1 added the federal employee credibility section, the old generic pillars created a jarring disconnect — the credibility setup wasn't followed through. This rewrite makes the whole page tell a coherent, distinctive story that no competitor agency can claim.

**Up next (strongest ideas still on deck):**
1. stoa.works — Strengthen contact section. It's just an email link. Add a one-paragraph framing: what kinds of projects fit, what to include in a first message, or a signal that you respond fast.
2. stanwood.dev — Add a "recently shipped" indicator somewhere on the homepage — the site is clearly active and growing but nothing signals that to first-time visitors.
3. stoa.works — Portfolio card outcomes. The cards show what the project does but not what it achieved. Even one concrete signal per card ("deployed to X agency", "live since Y") would add weight.

---

## Cycle 1 — 2026-03-26

**Site worked on:** stoa.works

**Ideas considered:**

stanwood.dev:
1. Add a "what's new" or "recently shipped" section to give return visitors a reason to come back
2. Improve the grid layout on mobile — some sections feel sparse
3. Add a brief bio/about link somewhere in the homepage footer area

stoa.works:
1. **Add insider credibility section** — surface that Stoa is built by a federal government employee (the single most differentiating fact, completely absent) ← CHOSE THIS
2. Rewrite "Why Stoa?" pillars to be more specific and differentiated (currently generic freelancer copy)
3. Strengthen the contact section — add a brief intake framing to improve lead quality

**What changed:** Added a new section between "Why Stoa?" and "Portfolio" on stoa.works homepage. A simple, direct block: federal-building emoji, bold headline "Built by a federal government employee," and 2 sentences explaining what that means for clients — that I understand procurement from the inside, know what teams actually use, and know why government software fails.

**Why highest-leverage:** The "Who built this?" question is the first filter any serious government client runs. The site had zero signal on this. Stephen IS the differentiator — an actual federal employee building gov-tech tools — and that wasn't mentioned anywhere. Adding this one section makes a credibility case no competitor can replicate.

**Up next (strongest ideas still on deck):**
1. stoa.works — Rewrite "Why Stoa?" pillars to be more specific and distinctive. Currently reads like any freelancer's pitch.
2. stoa.works — Strengthen contact section. Currently just an email link. Add framing about what kinds of projects fit, or a prompt to improve lead quality.
3. stanwood.dev — Add "recently shipped" signal — a small "new" badge or last-updated note to show the site is alive.

---

## Assets Needed

Running list of photos, images, and content that would meaningfully improve both sites.

### stoa.works

**Photo of Stephen (highest priority)**
- A clean, professional-but-not-stiff headshot for the contact/about area
- Ideally: natural light, outdoors or simple background, not a suit
- Could live next to the founder bio in the contact section

**Midjourney: hero / abstract civic tech image**
- Something that feels like "government infrastructure meets modern software" — think data, maps, public spaces, civic systems
- Light/neutral palette to match the site's cream/slate aesthetic
- Would go in the hero section or as a subtle background element

**Midjourney: portfolio page headers**
- Each project page has a plain dark header — a subtle abstract image for each would make them feel more real
- Could be themed per project: maps imagery for Parks Map, data viz for Budget, etc.

**Stoa logo refinement**
- Currently text-only. A simple mark (not a full logo system) would help recognition
- Could be a stylized S or an abstract civic symbol

### stanwood.dev

**Photo of Stephen (about page)**
- The about page has no photo — even a casual one would make it feel more personal
- Fun/casual fits the zine aesthetic better than professional here

**Tile images for any unimaged projects**
- Check which grid tiles are missing images vs using emoji fallbacks
