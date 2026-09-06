# ScatosSwip

Private house browsing at `https://stanwood.dev/lg`. Separate Stephen/Madeleine profiles, persistent saves, private notes, mutual matches, undo, photo galleries, school and budget filters. Previous/Next controls and the left/right arrow keys browse undecided homes without recording a choice; swiping or the explicit save/pass buttons make decisions. Browsing wraps around and leaves every undecided home available. A relaxed collection for a possible move over the next five years. No public homepage tile, analytics, or sitemap entry.

## Search contract

1. Fetch the **official Los Gatos High attendance polygon first** from the district-linked [School Explorer](https://www.lgsuhsd.org/enrollment). Fail closed if it is missing or ambiguous.
2. Start MLS discovery with its native **HighSchoolDistrict = Los Gatos-Saratoga Joint Union High** search. Narrow to Los Gatos detached houses. Cross-reference GoReal's small Los Gatos index for map coordinates; reject points outside the exact LGHS polygon before opening details wherever coordinates are available.
3. Check actual LGHS assignment with the official `GeoData/AnalyzeLocation` endpoint. District membership alone, nearby school lists, a Los Gatos mailing address, and a ZIP code never qualify a home.
4. Require active detached single-family houses, Los Gatos city as listed, price ≤ $4M, ≥4 beds, ≥2 baths. Los Gatos mailing addresses in the mountains remain eligible when officially assigned LGHS; proximity to town ranks in-town houses ahead.
5. Add Van Meter/Fisher bonuses from the **LGUSD-linked SchoolSiteLocator attendance-area service**, not nearby-school lists. Rank yards mentioned in listing text and walking-to-downtown claims as soft bonuses. Lot size is not treated as usable yard. Town distance is explicitly straight-line to Town Plaza, with a walking-directions link.

MLSListings supplies the primary source data from participating brokers and partner MLSs. GoReal is the second discovery index. Respect robots.txt and TLS; no logins, CAPTCHA bypasses, proxy workarounds, or paid data subscriptions. Original listing/photo attribution stays on each card. No copied marketing descriptions or downloaded photo archive.

Incomplete pagination, source/parser failures, and a suspicious empty feed never silently replace the last successful inventory. Partial results may refresh individually verified homes, but never archive unseen homes. A successful complete refresh archives missing homes. Unverified records leave the active deck after 72h; saves and notes remain as inspiration. Store price changes separately in `scatosswip.price_history`.

## Storage and access

Environment variables: `SCATOS_DATABASE_URL`, `SCATOS_PASSWORD`, `SCATOS_SESSION_SECRET`. Access codes are case-insensitive. The independent signing secret stays random even when the household chooses a memorable access code. An isolated `scatosswip` schema uses the existing private-app Postgres service. `schema.sql` only creates this app's tables. No contact or other application tables are read or modified.

Each session cookie includes an HMAC-signed profile and 90-day expiry. APIs derive identity from the cookie and reject cross-origin writes. Responses are private/no-store; server and client state are never prerendered. Profile selection intentionally uses one shared household access code. Notes belong to their author. No password/token is stored in source control or browser localStorage; localStorage only remembers optional filters.

## Mini schedule

Native LaunchAgent `dev.stanwood.scatosswip-refresh`, every day at **4:45 a.m. Pacific** (the Mini's system timezone). Independent installed copy at `~/.local/share/scatosswip`, so a dirty or changing shared git checkout cannot break the morning run. `run.py` uses an OS file lock, 25-minute collection timeout, atomic database publication and a dated receipt. Raw receipts retain 14 days; saves and price history remain in Postgres.

Installed files: `collect.py`, `publish.mjs`, `schema.sql`, `run.py`, `package.json`, `package-lock.json`, and a mode-600 `.env` containing only `SCATOS_DATABASE_URL`. Install dependencies with `npm ci --omit=dev` in that folder. The access password is only needed by the web app, not the collector.

Schedule file: `~/Library/LaunchAgents/dev.stanwood.scatosswip-refresh.plist`. Bootstrap via `launchctl bootstrap gui/$(id -u) <plist>`. Run now via `launchctl kickstart gui/$(id -u)/dev.stanwood.scatosswip-refresh`.

Verify completion, not just a loaded schedule:

```sh
cat ~/.local/state/scatosswip/latest-run.json
launchctl print gui/$(id -u)/dev.stanwood.scatosswip-refresh
```

Exit 0 = complete; exit 2 = partial (some individually verified records published); exit 1 = failure (prior verified data retained). The web app displays incomplete/stale feed status. No daily notification spam. Updating the collector requires copying the changed versioned task files to the installed directory, then testing a real run.

## Verification

```sh
python3 -m unittest discover -s scripts/scatosswip -p 'test_*.py'
node --env-file=.env.local scripts/scatosswip/publish.mjs --init
python3 scripts/scatosswip/collect.py --output /tmp/scatos-feed.json --receipts /tmp/scatos-receipts
node --env-file=.env.local scripts/scatosswip/publish.mjs /tmp/scatos-feed.json
npm run dev -- --host 127.0.0.1 --port 4345
node --env-file=.env.local scripts/scatosswip/qa.mjs --smoke --mock-decisions
npm run build
```

QA tests login, profile isolation, no-store APIs, CSRF protection, persistence, mutual matches, notes, undo, keyboard/pointer swipes, failed writes, saved archives, 320/390/768/1440 layouts, and accessibility. Its scoped temporary choices are restored in `finally`; use `--smoke` against production for read-only checks. Add `--mock-decisions` locally to test voting/undo after browsing with isolated UI responses and no database writes. Never run mutation QA while the couple is actively using the app.

## Family timing

For a February 2024 birthday, current California rules imply TK in fall 2028 and kindergarten in fall 2029. [LGUSD's current TK policy](https://www.lgusd.org/apps/pages/index.jsp?uREC_ID=2893247&type=d&pREC_ID=2548876) offers TK at all four elementary schools, with site preference/capacity determining TK placement and the home school determining kindergarten. Future 2028 placement rules must be rechecked. This is context, not a deadline or an enrollment automation.
