# South Bay Signal — Vision Log

---

## STANDING ORDERS (read every cycle before choosing what to build)

These are permanent directives from Stephen — override any other instinct:

1. **No local review — just ship.** Don't wait for approval. Build it, push it, merge it, move on.
2. **Aesthetics are lacking — fix aggressively.** The design is functional but not beautiful. Every cycle should make it feel more like a real product: typography, spacing, hierarchy, color, polish. This is a real gap.
3. **Mobile-first, always.** Check the mobile experience (375px) on every change. Don't build desktop-first and bolt on mobile. The "default homepage" goal requires excellent mobile.
4. **Events data: more is more.** Volume over curation. It's easier to trim too much data than to feel sparse. Add every verifiable recurring event you can find — libraries, parks, schools, Stanford calendar, city events, cultural centers, live music venues, etc. Aim for 100+ events.

---

## 2026-03-27 — Cycle 1: The Events Section

### Context
Previous scheduled-task cycles already built:
- `/south-bay` page with newspaper masthead, tabs, city filter pill navigation
- Sports view with ESPN API integration for Sharks, Warriors, SF Giants, 49ers, Earthquakes, Stanford, SJSU
- Government view with AI council digests for Campbell, Saratoga, and Los Altos (CivicEngage scraper)
- Events tab — disabled with "coming soon" placeholder
- MiLB integration for San Jose Giants via MLB Stats API
- Agenda scraper factory supporting CivicEngage + Legistar (Legistar not yet implemented)

### Issues Identified This Cycle
1. **Events tab disabled** — the single biggest gap between "dashboard demo" and "useful local product"
2. **Sports: NCAA football in March** — the ESPN college football scoreboard returns games in the offseason (spring games, old schedules), showing confusing results. Fix: season-aware path filtering.
3. **Sports: Stanford basketball missing** — caused by season filtering; NCAA basketball IS active in March (March Madness). The season filter fix correctly retains NCAAM while removing NCAAF.
4. **Council digests don't seem to do anything** — UI auto-fetches configured cities (Campbell, Saratoga, Los Altos) on tab load. The scraper itself may be failing on the CivicEngage pages or the AI key may not be set in the deployment environment. This needs deeper investigation: checking if the API route returns proper errors vs. silently failing.

### What Was Built

**1. Sports season awareness** (`src/lib/south-bay/teams.ts`)
Added `LEAGUE_ACTIVE_MONTHS` map — each league has defined active months. `getEspnPaths()` now skips fetching endpoints for off-season leagues. Result: no more random NCAAF games in March. March Madness (NCAAM) correctly continues to show.

**2. Events section** — the killer feature (finally live)

`src/data/south-bay/events-data.ts` — 40+ curated South Bay events:
- **Farmers markets**: Campbell, Mountain View, Sunnyvale, Palo Alto (2 locations), Los Gatos, Saratoga, Milpitas, Willow Glen, Downtown SJ
- **Family/kids**: Children's Discovery Museum, The Tech Interactive, Computer History Museum, Campbell Library story times, SJ Public Library programs, Mountain View Library events
- **Arts & culture**: SJ Museum of Art (free 3rd Fridays!), Montalvo Arts Center, Stanford Bing Concert Hall, Hammer Theatre, Cantor Arts Center (free always), SJ Jazz
- **Outdoor**: Vasona Lake / Billy Jones Wildcat Railroad, Alum Rock Park, Los Gatos Creek Trail, Shoreline Park MV, Rancho San Antonio
- **Stanford events**: Bing Concert Hall, free public lectures, The Dish hike, Cantor Arts, Stanford Athletics (many free)
- **Sports venues**: Sharks at SAP Center, Earthquakes at PayPal Park, SJ Giants at Excite Ballpark
- **Community**: Downtown Campbell summer concerts, MV free summer concerts, SJ Downtown Ice Rink
- **Food**: Santana Row, San Pedro Square Market, Downtown Campbell dining strip

`src/components/south-bay/views/EventsView.tsx`:
- Category filter pills: All / Markets / Family / Outdoors / Music / Arts / Sports / Education / Food / Community
- Time filter buttons: All / Today / Weekend / Weekday
- Kids-only checkbox
- Search box (title, description, city, venue)
- "Today" badge on events active on the current day
- Cost badges: FREE (green), $ (amber), $$ (purple)
- Filterable by city via the global city filter in SignalApp
- Event count in header ("X happening today")

**3. SignalApp updated**:
- Imported EventsView
- Removed the `disabled` flag on the Events tab
- Events tab now renders EventsView instead of "coming soon"

**4. OverviewView updated**:
- Shows live "N events happening today" count
- Teaser text for Events and Government sections

### Why This Was the Strongest Move
The Events section has been called "potentially the killer feature" since day one of planning. Having it perpetually disabled makes the product feel half-baked. With 40+ real, verifiable events across all 11 cities and 9 categories, the tab now delivers immediate value. A resident visiting on a Sunday morning sees "12 happening today" and can browse farmers markets, free library programs, and open parks — all in their city.

### What New Opportunities Emerged
1. **Live event feeds** — the static events data is a strong foundation. Next step: pull real event data from Eventbrite, SJ City events API, Library events calendars, and city parks departments.
2. **Government digest investigation** — the silent failure on council digests needs a real fix. Either the API is returning 404 because the CivicEngage scraper can't find the PDF links, or the ANTHROPIC_API_KEY isn't set. Add better error display (show the error message in the UI, not just a silent failure).
3. **Plan My Day** — now that events data exists, the interactive "Plan My Day" feature becomes buildable. It needs: weather API, events data, routing/time estimation, and Claude to compose the itinerary.
4. **Development tracker** — still the most unique potential section. "What's being built in your city?" with permit data.
5. **More cities for government digests** — implement the Legistar scraper to cover San Jose, Sunnyvale, Mountain View, Santa Clara, Cupertino.

### Next 3 Strongest Ideas
1. **Government digest fix + more cities** — Fix the silent failure, show real errors in the UI, and start implementing the Legistar scraper for at least one more city (San Jose or Mountain View).
2. **Plan My Day** — Signature interactive feature: pick your day, family type, and budget → get an AI-composed itinerary using the events data + weather. This is the "bookmark this page" moment.
3. **Development tracker** — A structured data layer for "what's being built" across cities. Even a curated JSON of major known projects (downtown SJ developments, Mountain View mixed-use projects, etc.) would make the product feel like no other local site.

### Does the Product Now Feel Meaningfully Closer to "Default Homepage for South Bay Life"?
**Yes — materially more useful.** The Events section was the biggest missing piece for utility. A resident can now use South Bay Signal on a Sunday morning to find farmers markets, or on a Friday afternoon to find free evening events. The city filter works across Events. The "Today" badge makes it immediately actionable. Combined with the working sports scoreboard, there's now real daily-use value — not just a civic demo.

---

## 2026-03-27 — Cycle 2: Today Tab → Real Morning Dashboard

### Context
Coming off Cycle 1 which delivered the Events section. The product now has live sports, curated events, and government digests. But the Today/Overview tab — the landing experience — was just the full sports scoreboard plus two text teasers. Opening South Bay Signal dropped you into a sports page. That's not a daily homepage.

### Issues Identified This Cycle
1. **Today tab weak as entry point** — first impression is "sports scoreboard + footnotes," not "daily South Bay briefing"
2. **Events data not surfaced on homepage** — we have 40+ events but nothing shows on the landing tab except a count in a teaser
3. **No ambient context** — no weather, no sense of "this is today, this is what's happening"

### What Was Built

**Redesigned OverviewView** (`src/components/south-bay/views/OverviewView.tsx`)

New structure, top to bottom:

1. **Weather strip** — fetches from existing `/api/weather` (Open-Meteo, free, no key). Shows live temp + conditions, e.g. "☀️ 68°F clear sky · South Bay, CA." Renders only when data loads; no flash of empty space on fetch.

2. **"Happening Today" section** — compact event list of every event active today. Sorted: free events first, then featured, then rest. Each row: emoji + title + cost badge (color-coded: green=FREE, amber=$, purple=$$) + city + time + venue. Shows up to 8 with "Show N more →" expand button. Newspaper-style typography (Playfair Display for titles).

3. **City Hall teaser** — compact info strip summarizing government digest coverage.

4. **Sports scoreboard** — full SportsView, unchanged, now in supporting role below the daily content.

### Why This Was the Strongest Move
The Today tab is the first impression — the argument for why someone should bookmark this. Before: "here's a sports scoreboard." After: "here's what's happening today — weather, events, then sports." The weather strip adds ambient context in one line. The events list is the real hook: instead of "12 events today" as a text teaser, you now see exactly what those 12 things are, for free. That's bookmarkable. It's what a local morning tab should do.

The rotation rule pushed away from pure data work (last cycle was Events) toward product/UX — the right call.

### What New Opportunities Emerged
1. **Events tab navigation from Today** — the Today tab shows events but doesn't deep-link to the Events tab with a city filter. A "See all in [city] →" interaction would add useful friction reduction.
2. **Plan My Day** — now the Today tab proves the events data has daily value. Plan My Day would be the interactive version of this: "build me a full day from what's available." The data foundation is solid.
3. **Government digest fix** — still the silent failure issue. Now more visible because the government teaser on Today tab would be much more powerful if the digest data showed there too.
4. **Development tracker** — "what's being built in your city?" is still the most unique possible section. No other South Bay site does this.
5. **Technology section** — local Bloomberg terminal for South Bay tech. Data-rich, chart-forward.

### Next 3 Strongest Ideas
1. **Plan My Day** — the signature interactive feature. Weather ✓, events data ✓, just need the AI itinerary builder. This is the "bookmark it forever" moment.
2. **Government digest fix** — investigate the silent failure (CivicEngage scraper or missing API key in deploy env). Even one working digest is better than three broken ones.
3. **Development tracker** — curate a JSON of 15-20 major known South Bay development projects (downtown SJ redevelopment, Mountain View mixed-use, etc.) with a clean "what's being built" view. Unique, ownable territory.

### Does the Product Now Feel Meaningfully Closer to "Default Homepage for South Bay Life"?
**Yes — materially closer to the morning tab promise.** The Today tab now earns its name. Someone opening it on a Thursday morning sees the weather, sees a list of real things happening today (a library story time, the Computer History Museum, Rancho San Antonio park, etc.), gets a City Hall teaser, and then finds the sports scoreboard. That's a daily briefing, not a sports widget. The sequence of information finally matches "this is your local morning tab."

---
