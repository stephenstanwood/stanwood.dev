import { useEffect, useState } from "react";
import {
  ALWAYS_SHOW_TEAMS,
  buildTeamLookup,
  fetchEventsForLeagues,
  getRelevantLeagues,
  isNbaPlayoff,
  matchUserTeam,
  readUserTeamKeys,
  yyyymmddInPT,
  type ESPNCompetitor,
  type ESPNEvent,
} from "../lib/wtwtwSports";
import { formatHourMinuteInTz } from "../lib/dateFormat";

interface TodayGame {
  id: string;
  league: string;
  awayAbbr: string;
  homeAbbr: string;
  startTime: string;
  startSortKey: number;
  isPlayoff: boolean;
  accent: string;
  statusText?: string;
  isLive: boolean;
}

function competitors(ev: ESPNEvent): ESPNCompetitor[] {
  return ev.competitions?.[0]?.competitors || [];
}

function stateOf(ev: ESPNEvent): string {
  return ev.competitions?.[0]?.status?.type?.state || "";
}

export default function TodaySports() {
  const [games, setGames] = useState<TodayGame[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const teamKeys = Array.from(
        new Set([...readUserTeamKeys(), ...ALWAYS_SHOW_TEAMS]),
      );
      const leagues = getRelevantLeagues(teamKeys);
      const lookup = buildTeamLookup(teamKeys);

      const ymd = yyyymmddInPT(new Date());
      const results = await fetchEventsForLeagues(leagues, ymd);

      const next: TodayGame[] = [];
      const seen = new Set<string>();
      for (const { league, events } of results) {
        for (const ev of events) {
          const state = stateOf(ev);
          // Show pre-game and in-progress; skip already-final games (those
          // are in the Yesterday rail tomorrow, and live games show in the
          // strip at the top).
          if (state === "post") continue;

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

          const startSortKey = new Date(ev.date).getTime();
          const isLive = state === "in";
          const statusText =
            ev.competitions?.[0]?.status?.type?.shortDetail ||
            ev.competitions?.[0]?.status?.type?.detail;
          const startTime = isLive
            ? statusText || "Live"
            : formatHourMinuteInTz(ev.date, "America/Los_Angeles") + " PT";

          next.push({
            id,
            league,
            awayAbbr: (away.team?.abbreviation || "AWY").toUpperCase(),
            homeAbbr: (home.team?.abbreviation || "HME").toUpperCase(),
            startTime,
            startSortKey,
            isPlayoff: playoff,
            accent: matched?.color || "#1a1a1a",
            statusText,
            isLive,
          });
        }
      }

      next.sort((a, b) => a.startSortKey - b.startSortKey);

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
    <section className="schedule-section" aria-label="Today's sports">
      <div className="schedule-row">
        <span className="schedule-leader">today ·</span>
        {games.map((g) => (
          <span
            key={g.id}
            className="schedule-chip"
            style={{ borderLeftColor: g.accent }}
            title={
              g.isPlayoff ? "NBA Playoffs · " + g.startTime : g.startTime
            }
          >
            <span className="schedule-teams">
              <span>{g.awayAbbr}</span>
              <span className="schedule-at">@</span>
              <span>{g.homeAbbr}</span>
            </span>
            <span className={`schedule-time ${g.isLive ? "live" : ""}`}>
              {g.isLive && <span className="schedule-live-dot" />}
              {g.startTime}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
