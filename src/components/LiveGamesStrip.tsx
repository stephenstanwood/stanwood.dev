import { useEffect, useState } from "react";
import { TEAM_REGISTRY, type TeamEntry } from "../lib/teamRegistry";
import { fetchEspnScoreboard, formatYYYYMMDD } from "../lib/sportsCore";
import { safeGet } from "../lib/localStorage";

interface ESPNCompetitor {
  team?: { abbreviation?: string; displayName?: string };
  homeAway?: "home" | "away";
  score?: string;
}

interface ESPNStatusType {
  name?: string;
  shortDetail?: string;
  detail?: string;
}

interface ESPNCompetition {
  competitors?: ESPNCompetitor[];
  status?: { type?: ESPNStatusType };
  broadcasts?: Array<{ names?: string[] }>;
}

interface ESPNEvent {
  id?: string;
  date: string;
  shortName?: string;
  name?: string;
  competitions?: ESPNCompetition[];
  season?: { type?: number; slug?: string };
}

interface LiveGame {
  id: string;
  league: string;
  awayAbbr: string;
  awayScore: string;
  homeAbbr: string;
  homeScore: string;
  detail: string;
  href: string;
  platform: string;
  accentColor: string;
}

const LS_KEY = "wtwtw:v1";
const POLL_MS = 60_000;
const PLAYOFF_LEAGUES = ["basketball/nba"];
const ALWAYS_SHOW_TEAMS = ["mlb-cubs", "mlb-giants"];

const PRIME_URL = "https://www.amazon.com/gp/video/storefront?ref_=atv_pr_sw_sc";
const YOUTUBE_TV_URL = "https://tv.youtube.com/";
const MLB_TV_URL = "https://www.mlb.com/tv";

function platformFor(
  matched: TeamEntry | null,
  leaguePath: string,
  broadcasts: string[]
): { href: string; label: string } {
  if (leaguePath === "basketball/nba") {
    const onPrime = broadcasts.some((b) => /prime/i.test(b));
    return onPrime
      ? { href: PRIME_URL, label: "Prime" }
      : { href: YOUTUBE_TV_URL, label: "YouTube TV" };
  }
  if (matched?.key === "mlb-cubs") return { href: MLB_TV_URL, label: "MLB.tv" };
  if (matched?.key === "mlb-giants") return { href: YOUTUBE_TV_URL, label: "YouTube TV" };
  if (matched?.key === "wnba-valkyries") return { href: YOUTUBE_TV_URL, label: "YouTube TV" };
  if (leaguePath === "baseball/mlb") return { href: MLB_TV_URL, label: "MLB.tv" };
  return { href: YOUTUBE_TV_URL, label: "YouTube TV" };
}

function isLive(ev: ESPNEvent): boolean {
  const n = ev.competitions?.[0]?.status?.type?.name || "";
  return n.includes("IN_PROGRESS");
}

function isNbaPlayoff(ev: ESPNEvent): boolean {
  if (ev.season?.type === 3) return true;
  if (ev.season?.slug === "post-season") return true;
  return false;
}

function broadcastsOf(ev: ESPNEvent): string[] {
  const out: string[] = [];
  for (const b of ev.competitions?.[0]?.broadcasts || []) {
    for (const n of b.names || []) out.push(n);
  }
  return out;
}

function competitors(ev: ESPNEvent): ESPNCompetitor[] {
  return ev.competitions?.[0]?.competitors || [];
}

function readUserTeamKeys(): string[] {
  const stored = safeGet<{ teams?: unknown }>(LS_KEY);
  if (stored && Array.isArray(stored.teams)) {
    return stored.teams.filter((k): k is string => typeof k === "string");
  }
  return [];
}

export default function LiveGamesStrip() {
  const [games, setGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      const teamKeys = Array.from(
        new Set([...readUserTeamKeys(), ...ALWAYS_SHOW_TEAMS])
      );

      const leaguesToFetch = new Set<string>();
      for (const k of teamKeys) {
        const t = TEAM_REGISTRY[k];
        if (t) leaguesToFetch.add(t.league);
      }
      for (const lp of PLAYOFF_LEAGUES) leaguesToFetch.add(lp);

      const yyyymmdd = formatYYYYMMDD();
      const results = await Promise.all(
        [...leaguesToFetch].map((lp) =>
          fetchEspnScoreboard<ESPNEvent>(lp, yyyymmdd)
            .then((r) => ({ lp, events: r.events || [] }))
            .catch(() => ({ lp, events: [] as ESPNEvent[] }))
        )
      );

      const teamByLeagueAbbr = new Map<string, TeamEntry>();
      for (const k of teamKeys) {
        const t = TEAM_REGISTRY[k];
        if (t) teamByLeagueAbbr.set(`${t.league}|${t.abbreviation.toUpperCase()}`, t);
      }

      const next: LiveGame[] = [];
      const seen = new Set<string>();

      for (const { lp, events } of results) {
        for (const ev of events) {
          if (!isLive(ev)) continue;

          let matched: TeamEntry | null = null;
          for (const c of competitors(ev)) {
            const abbr = (c.team?.abbreviation || "").toUpperCase();
            const t = teamByLeagueAbbr.get(`${lp}|${abbr}`);
            if (t) {
              matched = t;
              break;
            }
          }

          const playoff = lp === "basketball/nba" && isNbaPlayoff(ev);
          if (!matched && !playoff) continue;

          const id = ev.id || `${lp}|${ev.date}|${ev.shortName || ev.name}`;
          if (seen.has(id)) continue;
          seen.add(id);

          const cs = competitors(ev);
          const home = cs.find((c) => c.homeAway === "home");
          const away = cs.find((c) => c.homeAway === "away");
          if (!home || !away) continue;

          const broadcasts = broadcastsOf(ev);
          const platform = platformFor(matched, lp, broadcasts);
          const detail =
            ev.competitions?.[0]?.status?.type?.shortDetail ||
            ev.competitions?.[0]?.status?.type?.detail ||
            "Live";

          next.push({
            id,
            league: lp,
            awayAbbr: (away.team?.abbreviation || "AWY").toUpperCase(),
            awayScore: away.score ?? "0",
            homeAbbr: (home.team?.abbreviation || "HME").toUpperCase(),
            homeScore: home.score ?? "0",
            detail,
            href: platform.href,
            platform: platform.label,
            accentColor: matched?.color || "#1a1a1a",
          });
        }
      }

      if (!cancelled) setGames(next);
    }

    function start() {
      tick();
      intervalId = setInterval(tick, POLL_MS);
    }
    function stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
    function onVis() {
      if (document.hidden) stop();
      else {
        tick();
        if (!intervalId) start();
      }
    }

    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (games.length === 0) return null;

  return (
    <div className="live-strip" aria-label="Currently playing">
      <span className="live-label" aria-hidden="true">
        <span className="live-dot" />
        Live now
      </span>
      <div className="live-chips">
        {games.map((g) => (
          <a
            key={g.id}
            href={g.href}
            target="_blank"
            rel="noopener"
            className="live-chip"
            style={{ borderLeftColor: g.accentColor }}
            title={`${g.awayAbbr} ${g.awayScore} – ${g.homeAbbr} ${g.homeScore} · ${g.detail} · ${g.platform}`}
          >
            <span className="live-chip-teams">
              <span className="live-chip-team">{g.awayAbbr}</span>
              <span className="live-chip-score">{g.awayScore}</span>
              <span className="live-chip-sep">–</span>
              <span className="live-chip-team">{g.homeAbbr}</span>
              <span className="live-chip-score">{g.homeScore}</span>
            </span>
            <span className="live-chip-detail">{g.detail}</span>
            <span className="live-chip-platform">{g.platform}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
