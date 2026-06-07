import { useEffect, useState } from "react";
import {
  ALWAYS_SHOW_TEAMS,
  buildTeamLookup,
  awayHomeOf,
  bestUnseenFinishedGame,
  fetchEventsForLeagues,
  fetchMlbGamePks,
  fetchWnbaGameIds,
  getRelevantLeagues,
  isFinalEvent,
  isLatestStartedEventForTrackedTeams,
  isNbaPlayoff,
  latestStartedAtByTrackedTeam,
  isoDateInPT,
  matchUserTeam,
  readUserTeamKeys,
  statusTextOf,
  teamColorByAbbr,
  teamSideOf,
  watchRecordingUrl,
  yyyymmddInPT,
  type ESPNCompetitor,
  type ESPNEvent,
  type TeamSide as TeamSideBase,
} from "../lib/wtwtwSports";
import { MS_PER_DAY } from "../lib/time";

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
  return ev.id || `${league}|${iso}|${ev.date}|${ev.shortName}`;
}

export default function YesterdaySports() {
  const [games, setGames] = useState<YesterdayGame[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const teamKeys = Array.from(
        new Set([...readUserTeamKeys(), ...ALWAYS_SHOW_TEAMS]),
      );
      const leagues = getRelevantLeagues(teamKeys);
      const lookup = buildTeamLookup(teamKeys);

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
      for (const { iso, sortKey, results, mlbGamePks } of dayResults) {
        for (const { league, events } of results) {
          for (const ev of events) {
            if (!isFinalEvent(ev)) continue;
            if (
              !isLatestStartedEventForTrackedTeams(
                ev,
                league,
                lookup,
                latestStartedAtByTeam,
              )
            ) {
              continue;
            }
            const matched = matchUserTeam(ev, league, lookup);
            const playoff = league === "basketball/nba" && isNbaPlayoff(ev);
            if (!matched && !playoff) continue;

            const id = recapEventId(league, iso, ev);
            if (seen.has(id)) continue;
            seen.add(id);

            const ah = awayHomeOf(ev);
            if (!ah) continue;
            const { away, home } = ah;

            const awaySide = teamSide(away);
            const homeSide = teamSide(home);
            const watch = watchRecordingUrl({
              league,
              awayAbbr: awaySide.abbr,
              homeAbbr: homeSide.abbr,
              isoDate: iso,
              matchedKey: matched?.key,
              mlbGamePks,
              wnbaGameIds,
            });

            const statusText = statusTextOf(ev, "Final");

            next.push({
              id,
              league,
              daySortKey: sortKey,
              away: awaySide,
              home: homeSide,
              isPlayoff: playoff,
              isBestWnba: false,
              statusText,
              watchHref: watch.href,
              watchLabel: watch.label,
              accent: matched?.color || "#1a1a1a",
            });
          }
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
          if (best) {
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
                wnbaBadge: pick.isOverallBest
                  ? "Best WNBA game"
                  : "Next best WNBA game",
                statusText,
                watchHref: watch.href,
                watchLabel: watch.label,
                accent:
                  teamColorByAbbr("basketball/wnba", winner.abbr) ||
                  "#1a1a1a",
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

      if (!cancelled) {
        setGames(next);
        setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
            <div className="recap-matchup">
              <div className="recap-team">
                {g.away.logo && (
                  <img
                    className="recap-logo"
                    src={g.away.logo}
                    alt=""
                    loading="lazy"
                  />
                )}
                <div className="recap-team-text">
                  <span className="recap-team-name">{g.away.shortName}</span>
                  <span className="recap-team-abbr">{g.away.abbr}</span>
                </div>
                {!hideScores && (
                  <span
                    className={`recap-score ${g.away.winner ? "win" : "lose"}`}
                  >
                    {g.away.score}
                  </span>
                )}
              </div>
              <div className="recap-vs">@</div>
              <div className="recap-team home">
                {!hideScores && (
                  <span
                    className={`recap-score ${g.home.winner ? "win" : "lose"}`}
                  >
                    {g.home.score}
                  </span>
                )}
                <div className="recap-team-text">
                  <span className="recap-team-name">{g.home.shortName}</span>
                  <span className="recap-team-abbr">{g.home.abbr}</span>
                </div>
                {g.home.logo && (
                  <img
                    className="recap-logo"
                    src={g.home.logo}
                    alt=""
                    loading="lazy"
                  />
                )}
              </div>
            </div>
            <div className="recap-meta">
              <span className="recap-final">
                {g.isBestWnba
                  ? g.wnbaBadge || "Best WNBA game"
                  : g.isPlayoff
                    ? "Playoff · Final"
                    : "Final"}
              </span>
              <span className="recap-watch">Watch on {g.watchLabel} ↗</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
