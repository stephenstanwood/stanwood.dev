# TV queue

The Mini's existing `dev.stanwood.youtube-nightly` launchd job runs at 3:30 AM
Pacific. Its wrapper lives in `~/.claude/scheduled-tasks/stanford-queue/` and
calls this versioned `build_broader.py`. Do not create a second scheduler.

`TV_QUEUE_STATE_DIR` points to that existing directory: YouTube credentials,
channel preferences, feedback cache, and `selection_history.json` stay there.
`STANWOOD_REPO` selects the checkout whose `public/yt/broader.json` is written.
The wrapper's normal git publication remains unchanged. Audio/RSS generation
stays disabled with `YT_FEED_BASE_URL=""`.

Ten discovery searches rotate daily across software internals, debugging,
systems, design, visual computing, public technology, product craft, and a
small AI lane. English metadata, title relevance, and editorial review are
required. Review failure preserves the previous edition; one retry is allowed.
The edit has one video per creator, at most three per topic, no near-duplicate
titles, and a maximum of three appearances per video in seven prior editions.
Recent creator/video exposure lowers ranking. Reruns on the same day are
idempotent. Topic rotation gives the first row a varied mix. Feedback
exclusions still apply before selection.

The page preserves this order and applies the same caps to reserve refills.
It shows fewer picks when necessary instead of relaxing quality to fill rows.
History is local operational state, never committed. Seed it from recent
published editions when moving an existing installation onto this builder.

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
