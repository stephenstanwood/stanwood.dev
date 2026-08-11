import { useEffect, useState } from "react";
import {
  fetchEventsForLeagues,
  getTrackedTeamsContext,
  isPreEvent,
  trackedGames,
  yyyymmddInPT,
} from "../lib/wtwtwSports";
import { formatHourMinuteInTz, PACIFIC_TZ } from "../lib/dateFormat";

interface TodayGame {
  id: string;
  league: string;
  awayAbbr: string;
  homeAbbr: string;
  startTime: string;
  startSortKey: number;
  isPlayoff: boolean;
  accent: string;
}

export default function TodaySports() {
  const [games, setGames] = useState<TodayGame[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { leagues, lookup } = getTrackedTeamsContext();

      const ymd = yyyymmddInPT(new Date());
      const results = await fetchEventsForLeagues(leagues, ymd);

      const next: TodayGame[] = [];
      // Upcoming only — live games show as big tiles in LiveSports,
      // finished games move into the recap grid.
      for (const { id, league, event, match, away, home } of trackedGames(
        results,
        lookup,
        { include: isPreEvent },
      )) {
        next.push({
          id,
          league,
          awayAbbr: (away.team?.abbreviation || "AWY").toUpperCase(),
          homeAbbr: (home.team?.abbreviation || "HME").toUpperCase(),
          startTime: formatHourMinuteInTz(event.date, PACIFIC_TZ) + " PT",
          startSortKey: new Date(event.date).getTime(),
          isPlayoff: match.isPlayoff,
          accent: match.accent,
        });
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
    <div className="schedule-row" aria-label="Today's sports">
      <span className="schedule-leader">today ·</span>
      {games.map((g) => (
        <span
          key={g.id}
          className="schedule-chip"
          style={{ borderLeftColor: g.accent }}
          title={g.isPlayoff ? "NBA Playoffs · " + g.startTime : g.startTime}
        >
          <span className="schedule-teams">
            <span>{g.awayAbbr}</span>
            <span className="schedule-at">@</span>
            <span>{g.homeAbbr}</span>
          </span>
          <span className="schedule-time">{g.startTime}</span>
        </span>
      ))}
    </div>
  );
}
