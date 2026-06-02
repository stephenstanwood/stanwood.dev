import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALWAYS_SHOW_TEAMS,
  broadcastsOf,
  buildTeamLookup,
  awayHomeOf,
  fetchEventsForLeagues,
  getRelevantLeagues,
  isNbaPlayoff,
  matchUserTeam,
  readUserTeamKeys,
  teamSideOf,
  watchRecordingUrl,
  yyyymmddInPT,
  type ESPNEvent,
  type TeamSide,
} from "../lib/wtwtwSports";
import { MS_PER_MINUTE } from "../lib/time";
import { formatHourMinuteInTz } from "../lib/dateFormat";
import { findActiveWindow, type BigInningSchedule } from "../lib/bigInning";

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

function isInProgress(ev: ESPNEvent): boolean {
  const t = ev.competitions?.[0]?.status?.type;
  if ((t?.state || "") === "in") return true;
  if ((t?.name || "").includes("IN_PROGRESS")) return true;
  return false;
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
        const r = await fetch("/api/big-inning", { cache: "no-store" });
        if (!r.ok) return;
        const j: BigInningSchedule = await r.json();
        if (!cancelled) setSchedule(j);
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
      detail: `until ${formatHourMinuteInTz(active.end, "America/Los_Angeles")} PT`,
      href: MLB_TV_URL,
    };
  }, [schedule, now]);

  useEffect(() => {
    cancelledRef.current = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      const teamKeys = Array.from(
        new Set([...readUserTeamKeys(), ...ALWAYS_SHOW_TEAMS]),
      );
      const leagues = getRelevantLeagues(teamKeys);
      const lookup = buildTeamLookup(teamKeys);

      const ymd = yyyymmddInPT(new Date());

      const results = await fetchEventsForLeagues(leagues, ymd);

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

          const ah = awayHomeOf(ev);
          if (!ah) continue;
          const { away, home } = ah;

          const awaySide = teamSideOf(away);
          const homeSide = teamSideOf(home);
          const watch = watchRecordingUrl({
            league,
            awayAbbr: awaySide.abbr,
            homeAbbr: homeSide.abbr,
            isLive: true,
            broadcasts: broadcastsOf(ev),
            matchedKey: matched?.key,
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
      )}
    </>
  );
}
