# TV queue

## Around the internet

`/tv`'s **Around the internet** section is a nightly edition of TV-style
listings for YouTube: premium picks without the nonsense. The Mini
LaunchAgent **`dev.stanwood.tv-listings`** runs `nightly.py` at 2:15 AM
Pacific. It is the only scheduler for this section; stopping it freezes the
edition, and the page then says so in red instead of quietly shrinking.

`nightly.py` (installed copy: `~/.local/share/tv-listings/nightly.py`) fetches
`origin/main` into a temporary detached worktree, runs this directory's
`build_broader.py` from it, validates the edition (fresh, English, 8+ picks,
headlines present) and pushes `public/yt/broader.json` straight to `main`,
replaying the one-file commit if another bot pushed first. It never checks out,
resets or commits in the shared Mini checkout. Success is silent. A failure, or
a dead ✓/× mark server, posts one line to #tasks through `post-to-tasks.sh`.
Every run writes `~/.local/state/tv-listings/latest-run.json` and appends to
`run.log` there; a rejected edition is kept as `rejected-broader.json`.

Install or update on the Mini from any checkout: `scripts/tv-queue/install.sh`
(copies `nightly.py`, loads `dev.stanwood.tv-listings.plist`). Run one edition
now with `launchctl kickstart gui/$(id -u)/dev.stanwood.tv-listings`.

History: the old `dev.stanwood.youtube-nightly` job also rebuilt the hidden
Stanford queue and posted a nightly "stanford-queue" Discord embed. On
2026-10-14 a cleanup stopped it as Stanford-only, which silently froze this
section. It is retired (plist parked as `.retired-20261027`); the Stanford
builder no longer runs and `public/yt/videos.json` stays as its last output.

### State

`TV_QUEUE_STATE_DIR` (`~/.claude/scheduled-tasks/stanford-queue/`, name kept
for the mark server) holds YouTube credentials, channel preferences
(`handles.txt` → `channels.json` via `resolve_channels.py`), ✓/× marks,
feedback cache, `selection_history.json`, `editorial_cache.json`,
`discovery_inventory.json` and `presentation_cache.json`. History is local
operational state, never committed.

### Selection

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
short subject theme, an honest **headline** that replaces the YouTube title,
and the one-line blurb shown under it. Verdicts are cached per video
(`EDITORIAL_VERSION` invalidates them), so a night only judges new arrivals,
and batches retry with backoff and log the CLI's own failure reason. Unjudged
videos never publish; a night where the editor is down still publishes a fresh
rotation from cached verdicts. Fewer than eight distinct picks preserves the
previous edition.

The visible edit needs 65+, the reserve 55+; rank adds a freshness bonus (fades
over 14 days) and the learned ✓/× creator multiplier. The edit has one video per
creator and per theme, at most three per topic (four for AI in practice), at
most three hour-plus videos, no near-duplicate titles, and a maximum of three
appearances per video in seven prior editions. Recent creator/video exposure
lowers ranking. Reruns on the same day are idempotent. Topic rotation gives the
first row a varied mix. Feedback exclusions still apply before selection.

### Without the nonsense

No YouTube packaging reaches the page. The custom thumbnail is replaced by one
of YouTube's auto-captured stills from inside the video (`maxres{1,2,3}.jpg`,
falling back to `hq`), chosen to sit clear of
[SponsorBlock](https://sponsor.ajay.app/) sponsor, self-promo, intro and outro
segments; the page prints it as a riso-style duotone in the lane's ink and
restores colour on hover. Links start past an opening preview, intro or sponsor
read; sponsor time of 45 s or more is noted on the listing; videos SponsorBlock
marks as entirely sponsored never publish. SponsorBlock segments are cached for
20 hours, still availability forever.

### The page

The page shows the editor's edit only, numbered, with the top pick as a feature
box and a **play the edition** link (YouTube's anonymous `watch_videos`
playlist of the visible picks, in order). Reserve picks are rendered hidden in
rank order; marking a listing swaps in the next one that fits the same caps, so
the edition keeps its size and never refills past it. Eligibility is judged as
of the edition's `built_at`, never the deploy time, and an edition older than
36 hours carries a red "no new edition since …" note.

The ✓/× buttons post to `hide_server.py` (launchd `dev.stanwood.hide-server`,
port 8788, Funnel `:8443/api`). If it is down, marks wait in the browser's
outbox and the learned creator multipliers stop moving — check
`launchctl list | grep hide-server` before debugging taste drift.

Run `python3 scripts/tv-queue/test_selection.py`,
`python3 scripts/tv-queue/test_presentation.py` and `npm test`. To trial a
refresh, copy state to a temporary directory, use a temporary detached worktree
as `STANWOOD_REPO`, and run `build_broader.py` directly. **Do not kickstart the
LaunchAgent for a trial**: it publishes to `main`.

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
