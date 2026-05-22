import { useEffect, useRef, useState } from "react";
import {
  ALWAYS_SHOW_TEAMS,
  buildTeamLookup,
  fetchEventsForLeagues,
  fetchMlbGamePks,
  fetchWnbaGameIds,
  getRelevantLeagues,
  isNbaPlayoff,
  isoDateInPT,
  matchUserTeam,
  readUserTeamKeys,
  watchRecordingUrl,
  yyyymmddInPT,
  type ESPNCompetitor,
  type ESPNEvent,
} from "../lib/wtwtwSports";
import { MS_PER_MINUTE } from "../lib/time";

const POLL_MS = MS_PER_MINUTE;

interface LiveGame {
  id: string;
  league: string;
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
}

function competitors(ev: ESPNEvent): ESPNCompetitor[] {
  return ev.competitions?.[0]?.competitors || [];
}

function isInProgress(ev: ESPNEvent): boolean {
  const t = ev.competitions?.[0]?.status?.type;
  if ((t?.state || "") === "in") return true;
  if ((t?.name || "").includes("IN_PROGRESS")) return true;
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
    score: parseInt(c.score || "0", 10),
  };
}

export default function LiveSports() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      const teamKeys = Array.from(
        new Set([...readUserTeamKeys(), ...ALWAYS_SHOW_TEAMS]),
      );
      const leagues = getRelevantLeagues(teamKeys);
      const lookup = buildTeamLookup(teamKeys);

      const now = new Date();
      const ymd = yyyymmddInPT(now);
      const iso = isoDateInPT(now);

      const [results, mlbGamePks, wnbaGameIds] = await Promise.all([
        fetchEventsForLeagues(leagues, ymd),
        leagues.has("baseball/mlb")
          ? fetchMlbGamePks(iso)
          : Promise.resolve(new Map<string, number>()),
        leagues.has("basketball/wnba")
          ? fetchWnbaGameIds()
          : Promise.resolve(new Map<string, string>()),
      ]);

      const next: LiveGame[] = [];
      const seen = new Set<string>();
      for (const { league, events } of results) {
        for (const ev of events) {
          if (!isInProgress(ev)) continue;

          const matched = matchUserTeam(ev, league, lookup);
          const playoff = league === "basketball/nba" && isNbaPlayoff(ev);
          if (!matched && !playoff) continue;

          const id = ev.id || `${league}|${ev.date}|${ev.shortName}`;
          if (seen.has(id)) continue;
          seen.add(id);

          const cs = competitors(ev);
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
            "Live";

          next.push({
            id,
            league,
            away: awaySide,
            home: homeSide,
            isPlayoff: playoff,
            statusText,
            watchHref: watch.href,
            watchLabel: watch.label,
            accent: matched?.color || "#1a1a1a",
          });
        }
      }

      if (!cancelledRef.current) setGames(next);
    }

    tick();
    intervalId = setInterval(() => {
      if (!document.hidden) tick();
    }, POLL_MS);

    function onVis() {
      if (!document.hidden) tick();
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelledRef.current = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (games.length === 0) return null;

  return (
    <div className="recap-grid">
      {games.map((g) => (
        <a
          key={g.id}
          className="recap-tile live"
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
              <span className="recap-score live">{g.away.score}</span>
            </div>
            <div className="recap-vs">@</div>
            <div className="recap-team home">
              <span className="recap-score live">{g.home.score}</span>
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
            <span className="recap-live-status">
              <span className="recap-live-dot" />
              <span>
                LIVE
                {g.isPlayoff ? " · Playoff" : ""} · {g.statusText}
              </span>
            </span>
            <span className="recap-watch">Watch on {g.watchLabel} ↗</span>
          </div>
        </a>
      ))}
    </div>
  );
}
