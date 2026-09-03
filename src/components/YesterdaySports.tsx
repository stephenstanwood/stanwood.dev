import {
  awayHomeOf,
  bestUnseenFinishedGame,
  espnEventKey,
  fetchEventsForLeagues,
  fetchMlbGamePks,
  fetchWnbaGameIds,
  getTrackedTeamsContext,
  isFinalEvent,
  isLatestStartedEventForTrackedTeams,
  latestStartedAtByTrackedTeam,
  isoDateInPT,
  statusTextOf,
  teamColorByAbbr,
  teamSideOf,
  trackedGames,
  watchRecordingUrl,
  yyyymmddInPT,
  DEFAULT_TEAM_ACCENT,
  type ESPNCompetitor,
  type ESPNEvent,
  type TeamSide as TeamSideBase,
} from "../lib/wtwtwSports";
import { MS_PER_DAY } from "../lib/time";
import RecapMatchup from "./RecapMatchup";
import { useAsyncList } from "../hooks/useAsyncList";

interface YesterdayGame {
  id: string;
  league: string;
  daySortKey: number;
  away: TeamSide;
  home: TeamSide;
  isPlayoff: boolean;
  isBestWnba: boolean;
  wnbaBadge?: string;
  statusText: string;
  watchHref: string;
  watchLabel: string;
  accent: string;
}

interface TeamSide extends TeamSideBase {
  winner: boolean;
}

function isBasketballLeague(league: string): boolean {
  return league.startsWith("basketball/");
}

function teamSide(c: ESPNCompetitor): TeamSide {
  return { ...teamSideOf(c), winner: !!c.winner };
}

function recapTitle(g: YesterdayGame): string {
  if (isBasketballLeague(g.league)) {
    return `${g.away.shortName} @ ${g.home.shortName} · ${g.statusText}`;
  }
  return `${g.away.shortName} ${g.away.score} — ${g.home.shortName} ${g.home.score} · ${g.statusText}`;
}

function recapEventId(league: string, iso: string, ev: ESPNEvent): string {
  return espnEventKey(league, ev, iso);
}

function recapBadge(g: YesterdayGame): string {
  if (g.isBestWnba) return g.wnbaBadge || "Best WNBA game";
  if (g.isPlayoff) return "Playoff · Final";
  return "Final";
}

export default function YesterdaySports() {
  const { items: games, ready } = useAsyncList<YesterdayGame>(async () => {
    const { leagues, lookup } = getTrackedTeamsContext();

    const days = [new Date(), new Date(Date.now() - MS_PER_DAY)].map((d) => {
      const ymd = yyyymmddInPT(d);
      return {
        ymd,
        iso: isoDateInPT(d),
        sortKey: parseInt(ymd, 10),
      };
    });

    const [dayResults, wnbaGameIds] = await Promise.all([
      Promise.all(
        days.map(async (day) => {
          const [results, mlbGamePks] = await Promise.all([
            fetchEventsForLeagues(leagues, day.ymd),
            leagues.has("baseball/mlb")
              ? fetchMlbGamePks(day.iso)
              : Promise.resolve(new Map<string, number>()),
          ]);
          return { ...day, results, mlbGamePks };
        }),
      ),
      leagues.has("basketball/wnba")
        ? fetchWnbaGameIds()
        : Promise.resolve(new Map<string, string>()),
    ]);
    const latestStartedAtByTeam = latestStartedAtByTrackedTeam(
      dayResults.flatMap(({ results }) =>
        results.flatMap(({ league, events }) =>
          events.map((event) => ({ league, event })),
        ),
      ),
      lookup,
    );

    const next: YesterdayGame[] = [];
    const seen = new Set<string>();
    // A team's older games are dropped so only its most recent one gets a recap tile.
    const isRecappable = (ev: ESPNEvent, league: string) =>
      isFinalEvent(ev) &&
      isLatestStartedEventForTrackedTeams(ev, league, lookup, latestStartedAtByTeam);

    for (const { iso, sortKey, results, mlbGamePks } of dayResults) {
      for (const { id, league, event, match, away, home } of trackedGames(
        results,
        lookup,
        { include: isRecappable, isoDate: iso, seen },
      )) {
        const awaySide = teamSide(away);
        const homeSide = teamSide(home);
        const watch = watchRecordingUrl({
          league,
          awayAbbr: awaySide.abbr,
          homeAbbr: homeSide.abbr,
          isoDate: iso,
          matchedKey: match.matched?.key,
          mlbGamePks,
          wnbaGameIds,
        });

        next.push({
          id,
          league,
          daySortKey: sortKey,
          away: awaySide,
          home: homeSide,
          isPlayoff: match.isPlayoff,
          isBestWnba: false,
          statusText: statusTextOf(event, "Final"),
          watchHref: watch.href,
          watchLabel: watch.label,
          accent: match.accent,
        });
      }
    }

    // Yesterday's best WNBA game — the same pick the basketball launcher
    // icon deep-links to. Score every finished WNBA game with the shared
    // closeness × quality logic and surface the top one as a tile, even when
    // no tracked team played in it. Deduped against the tracked-team tiles
    // above via `seen`; when the Valkyries are the top game, surface the
    // next-best WNBA game too so the recap still has two watch options.
    if (leagues.has("basketball/wnba")) {
      const yesterdayYmd = yyyymmddInPT(new Date(Date.now() - MS_PER_DAY));
      const yDay = dayResults.find((d) => d.ymd === yesterdayYmd);
      const wnbaEvents =
        yDay?.results.find((r) => r.league === "basketball/wnba")?.events ?? [];

      if (yDay) {
        const pick = bestUnseenFinishedGame(wnbaEvents, (ev) =>
          seen.has(recapEventId("basketball/wnba", yDay.iso, ev)),
        );
        const best = pick?.event ?? null;
        if (pick && best) {
          const id = recapEventId("basketball/wnba", yDay.iso, best);
          const ah = awayHomeOf(best);
          if (ah) {
            seen.add(id);
            const awaySide = teamSide(ah.away);
            const homeSide = teamSide(ah.home);
            const watch = watchRecordingUrl({
              league: "basketball/wnba",
              awayAbbr: awaySide.abbr,
              homeAbbr: homeSide.abbr,
              isoDate: yDay.iso,
              wnbaGameIds,
            });
            const winner = awaySide.winner ? awaySide : homeSide;
            const statusText = statusTextOf(best, "Final");
            next.push({
              id,
              league: "basketball/wnba",
              daySortKey: yDay.sortKey,
              away: awaySide,
              home: homeSide,
              isPlayoff: false,
              isBestWnba: true,
              wnbaBadge: pick?.isOverallBest
                ? "Best WNBA game"
                : "Next best WNBA game",
              statusText,
              watchHref: watch.href,
              watchLabel: watch.label,
              accent:
                teamColorByAbbr("basketball/wnba", winner.abbr) ||
                DEFAULT_TEAM_ACCENT,
            });
          }
        }
      }
    }

    next.sort((a, b) => {
      if (a.daySortKey !== b.daySortKey) return b.daySortKey - a.daySortKey;
      if (a.league !== b.league) return a.league.localeCompare(b.league);
      return a.id.localeCompare(b.id);
    });
    return next;
  });

  if (!ready || games.length === 0) return null;

  return (
    <div className="recap-grid">
      {games.map((g) => {
        const hideScores = isBasketballLeague(g.league);
        const primeWnbaAuth = g.league === "basketball/wnba";
        return (
          <a
            key={g.id}
            className="recap-tile"
            href={g.watchHref}
            target="_blank"
            rel="noopener"
            data-wnba-auth-launch={primeWnbaAuth ? "true" : undefined}
            style={{ borderLeftColor: g.accent }}
            title={recapTitle(g)}
          >
            <RecapMatchup
              away={g.away}
              home={g.home}
              renderScore={(team) =>
                hideScores ? null : (
                  <span className={`recap-score ${team.winner ? "win" : "lose"}`}>
                    {team.score}
                  </span>
                )
              }
            />
            <div className="recap-meta">
              <span className="recap-final">
                {recapBadge(g)}
              </span>
              <span className="recap-watch">Watch on {g.watchLabel} ↗</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
