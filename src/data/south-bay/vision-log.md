# South Bay Signal — Vision Log

---

## 2026-03-27 — Cycle 1: The Front Door

### Ideas Considered
1. **Create the South Bay Signal homepage** — The single most critical missing piece. No homepage = no product. Everything else is orphaned without it.
2. **Live sports scores strip** — Warriors/Sharks/Giants/49ers live via ESPN public API. Filterable to local teams only.
3. **City selector across 11 cities** — Global filter in the header that narrows all sections.
4. **Tech section** — Major South Bay employers (Apple, NVIDIA, Google, Intel, Cisco, etc.) with city/headcount data.
5. **Government section** — Upcoming council meetings with city/body/highlight structured cards.
6. **Events section** — Structural placeholder with recurring events; real calendar TBD.
7. **Plan My Day** — Signature interactive feature (ambitious, saved for a later cycle when events data is richer).
8. **Development tracker** — What's being built/approved/opened (strong future feature, needs data layer first).

### What Was Built
**`/south-bay` — South Bay Signal homepage (v1)**

Created the front door to the entire product:
- **Brand identity**: "SOUTH BAY SIGNAL" wordmark in navy header, "Local signal. No noise." tagline
- **Four-tab navigation**: Sports / Government / Tech / Events
- **Sports tab**: Live ESPN API integration for Warriors (NBA), Sharks (NHL), Giants (MLB), 49ers (NFL). Filters for only South Bay teams. Shows live scores with LIVE pulse indicator, game times, broadcasts. Falls back gracefully when no games are scheduled.
- **Weather strip**: Always-visible San Jose weather bar across all tabs (Open-Meteo, free, no key).
- **Government tab**: Structured upcoming meeting cards for 5 cities (San Jose, Campbell, Mountain View, Santa Clara, Sunnyvale). Links to council portals. Campbell Portal CTA.
- **Tech tab**: 12 major South Bay employers (Apple, NVIDIA, Google, Intel, Cisco, Adobe, etc.) with city, ticker, and approximate headcount. Filterable by city.
- **Events tab**: Recurring events (farmers markets across SJ/Campbell/Los Gatos/MV, Sharks home games) with city/free/type tags. Coming-soon CTA for full calendar.
- **City selector**: 11-city global filter in the header (All Cities, San Jose, Santa Clara, Sunnyvale, Mountain View, Palo Alto, Cupertino, Campbell, Los Gatos, Saratoga, Los Altos, Milpitas).
- **Mobile responsive**: Two-column grids collapse to single-column at 600px.

### Why This Was the Strongest Move
Without a homepage, the product has no front door. The Campbell portal, aesthetic weather, and Sonoma dashboard are orphaned pages with no connective tissue. Creating `/south-bay` as the branded hub:
- Establishes the product identity (South Bay Signal as a real thing)
- Gives residents a single URL to bookmark
- Creates the scaffold every future section will plug into
- Proves the concept: "what does a smart local homepage actually feel like?"

The sports + weather combination gives immediate live utility on day one — there's something real to look at every day.

### What New Opportunities Emerged
- **Development tracker** is the clearest next high-value section. "What's being built in my city?" has no clean answer anywhere. Needs a data structure + eventual permit API scraping.
- **Government section needs real AI digests** across more cities, not just Campbell. The infrastructure exists (`/api/campbell/digest`); needs to be generalized.
- **Events calendar is the killer feature** — but needs real data. The structure is in place; next step is identifying reliable sources (city event pages, Eventbrite, library event feeds) and building a scraping/aggregation layer.
- **Plan My Day** should come once events data is populated. It's the signature interactive feature.
- **Tech section needs live signals** — hiring velocity from LinkedIn/Glassdoor, funding rounds from Crunchbase, news mentions. Static employee counts are a placeholder.

### Next 3 Strongest Ideas (Priority Order)
1. **Development tracker** — `src/data/south-bay/development.json` with recent permit approvals, projects proposed/approved, what's opening/closing. Makes the product immediately feel like a local intelligence tool, not a dashboard.
2. **Government digests for more cities** — Generalize the AI digest infrastructure beyond Campbell to Mountain View, Sunnyvale, San Jose. Each city gets a "last council meeting summary" card driven by real agenda scraping.
3. **Events data layer** — Scrape/aggregate recurring and one-off events from city event pages. Even 20 real events makes this section feel alive vs. placeholder.

### Does the Product Now Feel Meaningfully Closer to "Default Homepage for South Bay Life"?
**Yes — significantly.** Went from scattered orphan pages to a real product with a front door. The `/south-bay` URL is now something a resident could plausibly bookmark. The live sports scores give it immediate daily utility. The city selector makes it feel like it actually covers the region, not just Campbell. Still early — the events and development sections are clearly placeholders — but the scaffold is right and the identity is clear.

---
