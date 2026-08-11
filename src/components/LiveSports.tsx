import { useEffect, useMemo, useRef, useState } from "react";
import {
  broadcastsOf,
  fetchEventsForLeagues,
  getTrackedTeamsContext,
  isLiveEvent,
  statusTextOf,
  teamSideOf,
  trackedGames,
  watchRecordingUrl,
  yyyymmddInPT,
  type TeamSide,
} from "../lib/wtwtwSports";
import { MS_PER_MINUTE } from "../lib/time";
import { formatHourMinuteInTz, PACIFIC_TZ } from "../lib/dateFormat";
import { findActiveWindow, type BigInningSchedule } from "../lib/bigInning";
import RecapMatchup from "./RecapMatchup";

const POLL_MS = MS_PER_MINUTE;
const SCHEDULE_REFRESH_MS = 30 * MS_PER_MINUTE;
const BIG_INNING_ACCENT = "#bf0d3e";
const MLB_TV_URL = "https://www.mlb.com/tv";

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

interface BigInningPill {
  detail: string;
  href: string;
}

export default function LiveSports() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [schedule, setSchedule] = useState<BigInningSchedule | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const cancelledRef = useRef(false);

  // Big Inning schedule — fetched from our /api/big-inning endpoint and
  // refreshed every 30 minutes. Schedule data is small and stable.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/big-inning", { cache: "no-store" });
        if (!res.ok) return;
        const data: BigInningSchedule = await res.json();
        if (!cancelled) setSchedule(data);
      } catch {
        /* keep prior schedule */
      }
    }
    load();
    const id = setInterval(load, SCHEDULE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Wall-clock ticker so the Big Inning pill appears/disappears as windows
  // open and close without waiting for a full page reload.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const bigInning = useMemo<BigInningPill | null>(() => {
    const active = findActiveWindow(schedule, now);
    if (!active) return null;
    return {
      detail: `until ${formatHourMinuteInTz(active.end, PACIFIC_TZ)} PT`,
      href: MLB_TV_URL,
    };
  }, [schedule, now]);

  useEffect(() => {
    cancelledRef.current = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      const { leagues, lookup } = getTrackedTeamsContext();

      const ymd = yyyymmddInPT(new Date());

      const results = await fetchEventsForLeagues(leagues, ymd);

      const next: LiveGame[] = [];
      for (const { id, league, event, match, away, home } of trackedGames(
        results,
        lookup,
        { include: isLiveEvent },
      )) {
        const awaySide = teamSideOf(away);
        const homeSide = teamSideOf(home);
        const watch = watchRecordingUrl({
          league,
          awayAbbr: awaySide.abbr,
          homeAbbr: homeSide.abbr,
          isLive: true,
          broadcasts: broadcastsOf(event),
          matchedKey: match.matched?.key,
        });

        next.push({
          id,
          league,
          away: awaySide,
          home: homeSide,
          isPlayoff: match.isPlayoff,
          statusText: statusTextOf(event, "Live"),
          watchHref: watch.href,
          watchLabel: watch.label,
          accent: match.accent,
        });
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

  if (games.length === 0 && !bigInning) return null;

  return (
    <>
      {bigInning && (
        <a
          className="big-inning-pill"
          href={bigInning.href}
          target="_blank"
          rel="noopener"
          style={{ borderLeftColor: BIG_INNING_ACCENT }}
          title={`MLB Big Inning is broadcasting now · ${bigInning.detail}`}
        >
          <span className="big-inning-dot" />
          <span className="big-inning-label">MLB Big Inning on now</span>
          <span className="big-inning-detail">{bigInning.detail}</span>
          <span className="big-inning-platform">MLB.tv ↗</span>
        </a>
      )}
      {games.length > 0 && (
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
          <RecapMatchup
            away={g.away}
            home={g.home}
            renderScore={(team) => (
              <span className="recap-score live">{team.score}</span>
            )}
          />
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
      )}
    </>
  );
}
