import { useEffect, useState } from "react";
import {
  ALWAYS_SHOW_TEAMS,
  buildTeamLookup,
  competitorsOf,
  fetchEventsForLeagues,
  fetchMlbGamePks,
  fetchWnbaGameIds,
  getRelevantLeagues,
  isLatestStartedEventForTrackedTeams,
  isNbaPlayoff,
  latestStartedAtByTrackedTeam,
  isoDateInPT,
  matchUserTeam,
  readUserTeamKeys,
  watchRecordingUrl,
  yyyymmddInPT,
  type ESPNCompetitor,
  type ESPNEvent,
} from "../lib/wtwtwSports";
import { parseScore } from "../lib/sportsCore";
import { MS_PER_DAY } from "../lib/time";

interface YesterdayGame {
  id: string;
  league: string;
  daySortKey: number;
  away: TeamSide;
  home: TeamSide;
  isPlayoff: boolean;
  statusText: string;
  watchHref: string;
  watchLabel: string;
  accent: string;
}

interface TeamSide {
  abbr: string;
  shortName: string;
  logo: string;
  score: number;
  winner: boolean;
}

function isFinal(ev: ESPNEvent): boolean {
  const t = ev.competitions?.[0]?.status?.type;
  if (t?.completed) return true;
  if ((t?.state || "") === "post") return true;
  return false;
}

function teamSide(c: ESPNCompetitor): TeamSide {
  return {
    abbr: (c.team?.abbreviation || "???").toUpperCase(),
    shortName:
      c.team?.shortDisplayName ||
      c.team?.name ||
      c.team?.abbreviation ||
      "Team",
    logo: c.team?.logo || "",
    score: parseScore(c.score),
    winner: !!c.winner,
  };
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
            if (!isFinal(ev)) continue;
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

            const id = ev.id || `${league}|${iso}|${ev.date}|${ev.shortName}`;
            if (seen.has(id)) continue;
            seen.add(id);

            const cs = competitorsOf(ev);
            const away = cs.find((c) => c.homeAway === "away");
            const home = cs.find((c) => c.homeAway === "home");
            if (!away || !home) continue;

            const awaySide = teamSide(away);
            const homeSide = teamSide(home);
            const watch = watchRecordingUrl({
              league,
              awayAbbr: awaySide.abbr,
              homeAbbr: homeSide.abbr,
              isoDate: iso,
              mlbGamePks,
              wnbaGameIds,
            });

            const statusText =
              ev.competitions?.[0]?.status?.type?.shortDetail ||
              ev.competitions?.[0]?.status?.type?.detail ||
              "Final";

            next.push({
              id,
              league,
              daySortKey: sortKey,
              away: awaySide,
              home: homeSide,
              isPlayoff: playoff,
              statusText,
              watchHref: watch.href,
              watchLabel: watch.label,
              accent: matched?.color || (playoff ? "#1a1a1a" : "#1a1a1a"),
            });
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
        {games.map((g) => (
          <a
            key={g.id}
            className="recap-tile"
            href={g.watchHref}
            target="_blank"
            rel="noopener"
            style={{ borderLeftColor: g.accent }}
            title={`${g.away.shortName} ${g.away.score} — ${g.home.shortName} ${g.home.score} · ${g.statusText}`}
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
                <span
                  className={`recap-score ${g.away.winner ? "win" : "lose"}`}
                >
                  {g.away.score}
                </span>
              </div>
              <div className="recap-vs">@</div>
              <div className="recap-team home">
                <span
                  className={`recap-score ${g.home.winner ? "win" : "lose"}`}
                >
                  {g.home.score}
                </span>
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
                {g.isPlayoff ? "Playoff · Final" : "Final"}
              </span>
              <span className="recap-watch">Watch on {g.watchLabel} ↗</span>
            </div>
          </a>
        ))}
    </div>
  );
}
