# Mini Big Inning sync

Canonical source for the existing `dev.stanwood.big-inning-sync` LaunchAgent.
Installed runtime: `~/scripts/big-inning-sync` on `Stephens-Mac-mini.local`.
The existing plist runs daily at **11:15 AM Pacific**; installation does not
change or recreate it.

```sh
node --test scripts/big-inning-sync/sync.node-test.mjs
# On the Mini, after copying these files into the installed runtime:
/opt/homebrew/bin/node ~/scripts/big-inning-sync/sync.mjs --check
```

`--check` reads the official source and writes a private run receipt without
publishing. Ordinary runs publish only valid, nonempty schedules through an
isolated temporary Git worktree; they never reset or switch the shared checkout.
Unchanged windows do not create commits. Concurrent remote changes reject
normally and remain failures.

MLB removed the support schedule after the September 27, 2026 regular-season
finale. The Mini still parsed 45 windows on September 27; zero-row runs began
September 28. The official support page now renders `404 Not Found`, support
search has no schedule article, and the [MLB Network Big Inning page](https://www.mlb.com/network/shows/big-inning)
has no upcoming rows. The Network schedule covers Network airings; it is not
used to fabricate a replacement MLB.TV schedule.

A removed article is a successful `no-published-schedule` outcome only when:

- MLB's live [season metadata](https://statsapi.mlb.com/api/v1/seasons/2026?sportId=1)
  establishes that the Eastern date is outside the current regular season.
- The preserved, nonempty schedule ends exactly on the last completed regular
  season's official final date, with valid dates and times from that season.
- The source returned an actual HTTP/rendered 404, rather than a blank shell,
  timeout, permission denial, rate limit, or other server failure.

The same checks continue daily. A returned table is parsed and published even
outside the regular season. On opening day, the seasonal exception expires.
Missing or malformed season metadata fails closed. Every empty result preserves
the saved data; this state never creates dates or overwrites the 45-window
snapshot. MLB's [2026 schedule announcement](https://www.mlb.com/press-release/press-release-mlb-announces-2026-regular-season-schedule)
independently confirms the September 27 finale.

`~/.local/state/big-inning-sync/latest-run.json` records the source response,
season boundaries, outcome, exit status, and before/after schedule hashes.
The wrapper propagates real failures to launchd and retains #tasks alerts for
unexpected missing data. A seasonal no-op exits zero without posting an alert.

To update the already-installed runtime, copy `sync.mjs`, `schedule.mjs`,
`publish.mjs`, and `run.sh` into `~/scripts/big-inning-sync` on the Mini,
retaining executable mode for `run.sh`. Its existing `puppeteer` dependency
and lockfile are unchanged. Verify `--check`, then the existing launchd job and
its new receipt, without changing the plist. Keep a private backup of the
previous runtime and use a hash check to avoid overwriting concurrent changes.
