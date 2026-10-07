# TV queue

The Mini's existing `dev.stanwood.youtube-nightly` launchd job runs at 3:30 AM
Pacific. Its wrapper lives in `~/.claude/scheduled-tasks/stanford-queue/` and
calls this versioned `build_broader.py`. Do not create a second scheduler.

`TV_QUEUE_STATE_DIR` points to that existing directory: YouTube credentials,
channel preferences (`handles.txt` → `channels.json` via `resolve_channels.py`),
✓/× marks, feedback cache, `selection_history.json`, `editorial_cache.json`, and
`discovery_inventory.json` stay there. `STANWOOD_REPO` selects the checkout
whose `public/yt/broader.json` is written. The wrapper's normal git publication
remains unchanged. Audio/RSS generation stays disabled with `YT_FEED_BASE_URL=""`.

Candidates come from the trusted channels plus ten open searches a night (one
per lane, three rotating angles each: practical AI, dev world, war stories,
how it works, design, product, visual computing, tech history, public tech,
making). Open-search finds that pass the gates are remembered for the 14-day
window. Deterministic gates only keep the editor's input sane: English, 3 min
to 4 h, not live, no title blocklist hit or strong guardrail (politics, health,
humanities, climate, K-12). Open search also needs a relevant title, 25+ views
a day, 0.5%+ engagement, and a People & Blogs / News / Howto / Education /
Science & Tech category. Trusted creators no longer need keyword-rich titles —
that gate dropped exactly the punchy videos Stephen liked.

A tool-free Sonnet editor scores every survivor 0–100 and returns a topic, a
short subject theme, and the one-line blurb shown on the card. Verdicts are
cached per video (`EDITORIAL_VERSION` invalidates them), so a night only judges
new arrivals, and batches retry with backoff and log the CLI's own failure
reason. Unjudged videos never publish; a night where the editor is down still
publishes a fresh rotation from cached verdicts. Fewer than eight distinct picks
preserves the previous edition.

The visible edit needs 65+, the reserve 55+; rank adds a freshness bonus (fades
over 14 days) and the learned ✓/× creator multiplier. The edit has one video per
creator and per theme, at most three per topic (four for AI in practice), at
most three hour-plus videos, no near-duplicate titles, and a maximum of three
appearances per video in seven prior editions. Recent creator/video exposure
lowers ranking. Reruns on the same day are idempotent. Topic rotation gives the
first row a varied mix. Feedback exclusions still apply before selection.

The page preserves this order and applies the same caps to reserve refills.
It shows fewer picks when necessary instead of relaxing quality to fill rows.
History is local operational state, never committed. Seed it from recent
published editions when moving an existing installation onto this builder.

The ✓/× buttons post to `hide_server.py` (launchd `dev.stanwood.hide-server`,
port 8788, Funnel `:8443/api`). If it is down, marks wait in the browser's
outbox and the learned creator multipliers stop moving — check
`launchctl list | grep hide-server` before debugging taste drift.

Run `python3 scripts/tv-queue/test_selection.py` and `npm test`. To trial a
refresh, copy state to a temporary directory, use a temporary output checkout,
and run this builder directly. **Do not run the nightly wrapper for a trial**:
it also publishes and sends a notification.

## Replay queue

`/api/tv/replays` resolves fixed slots from ESPN schedules and official league
game IDs. It caches for five minutes and retains saved games on upstream
failures. The browser also preserves its last successful feed. Favorite slots
only advance to a completed game. NFL's other-game pick covers the previous
Thursday–Monday football weekend and excludes both favorite teams. Its score
weights final closeness most, then overtime, quarter lead changes, late
closeness, team records, and postseason play. Ranking details never appear
on the spoiler-free cards.

NFL links open the exact game's Highlights & Replays tab. On September 28,
2026, the current NFL player selected replay type in local React state, with
no URL selector. Its older `/plus/games/:slug?mcpid=…` route redirects to
`/games/:slug` and drops the selection. Do not advertise autoplay or manufacture
an unverified full-replay URL. The tile says “Select Full Game Replay.”

NBA links use official game IDs, with an overnight processing allowance and a
72-hour local blackout allowance after the estimated end of Warriors/Kings
games (national broadcasts use the overnight window). Availability still
depends on the account and provider; choose the edited full broadcast for
commercial-free viewing. No subscription checkout or account changes happen
here. NBA Now is independent and unchanged.
