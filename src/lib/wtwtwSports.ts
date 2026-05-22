// Shared helpers for the /youtube sports rails (yesterday recap + today schedule).
// Pulls user team prefs from WTWTW localStorage, fans out to ESPN scoreboards,
// and resolves watch-recording links per league.

import { TEAM_REGISTRY, type TeamEntry } from "./teamRegistry";
import { fetchEspnScoreboard } from "./sportsCore";
import { safeGet } from "./localStorage";

export const WTWTW_LS_KEY = "wtwtw:v1";
export const ALWAYS_SHOW_TEAMS = ["mlb-cubs", "mlb-giants", "wnba-valkyries"];
export const PLAYOFF_LEAGUES = ["basketball/nba"];

export interface ESPNCompetitor {
  team?: {
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    location?: string;
    name?: string;
    logo?: string;
  };
  homeAway?: "home" | "away";
  score?: string;
  winner?: boolean;
}

export interface ESPNStatusType {
  name?: string;
  state?: string;
  shortDetail?: string;
  detail?: string;
  completed?: boolean;
}

export interface ESPNCompetition {
  competitors?: ESPNCompetitor[];
  status?: { type?: ESPNStatusType };
}

export interface ESPNEvent {
  id?: string;
  date: string;
  shortName?: string;
  name?: string;
  competitions?: ESPNCompetition[];
  season?: { type?: number; slug?: string };
}

export function readUserTeamKeys(): string[] {
  const stored = safeGet<{ teams?: unknown }>(WTWTW_LS_KEY);
  if (stored && Array.isArray(stored.teams)) {
    return stored.teams.filter((k): k is string => typeof k === "string");
  }
  return [];
}

export function getRelevantLeagues(teamKeys: string[]): Set<string> {
  const out = new Set<string>();
  for (const k of teamKeys) {
    const t = TEAM_REGISTRY[k];
    if (t) out.add(t.league);
  }
  for (const lp of PLAYOFF_LEAGUES) out.add(lp);
  return out;
}

export function buildTeamLookup(teamKeys: string[]): Map<string, TeamEntry> {
  const m = new Map<string, TeamEntry>();
  for (const k of teamKeys) {
    const t = TEAM_REGISTRY[k];
    if (t) m.set(`${t.league}|${t.abbreviation.toUpperCase()}`, t);
  }
  return m;
}

export function isNbaPlayoff(ev: ESPNEvent): boolean {
  if (ev.season?.type === 3) return true;
  if (ev.season?.slug === "post-season") return true;
  return false;
}

export function matchUserTeam(
  ev: ESPNEvent,
  league: string,
  lookup: Map<string, TeamEntry>,
): TeamEntry | null {
  const cs = ev.competitions?.[0]?.competitors || [];
  for (const c of cs) {
    const abbr = (c.team?.abbreviation || "").toUpperCase();
    const t = lookup.get(`${league}|${abbr}`);
    if (t) return t;
  }
  return null;
}

/** YYYYMMDD for ESPN, computed in Pacific Time. */
export function yyyymmddInPT(d: Date): string {
  const s = d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  return s.replace(/-/g, "");
}

/** YYYY-MM-DD for MLB StatsAPI, computed in Pacific Time. */
export function isoDateInPT(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

export async function fetchEventsForLeagues(
  leagues: Iterable<string>,
  yyyymmdd: string,
): Promise<Array<{ league: string; events: ESPNEvent[] }>> {
  const arr = [...leagues];
  return Promise.all(
    arr.map((lp) =>
      fetchEspnScoreboard<ESPNEvent>(lp, yyyymmdd)
        .then((r) => ({ league: lp, events: r.events || [] }))
        .catch(() => ({ league: lp, events: [] as ESPNEvent[] })),
    ),
  );
}

// ── MLB.tv gamePk lookup ────────────────────────────────────────────────────
// ESPN doesn't expose the MLB gamePk that mlb.com/tv URLs use, so we hit
// statsapi.mlb.com to map (away abbr, home abbr) → gamePk for a given date.

interface StatsApiGame {
  gamePk: number;
  teams: {
    away: { team: { abbreviation?: string } };
    home: { team: { abbreviation?: string } };
  };
}

interface StatsApiSchedule {
  dates?: Array<{ games?: StatsApiGame[] }>;
}

const STATS_API_TEAM_ABBR_OVERRIDES: Record<string, string> = {
  AZ: "ARI",
  ATH: "OAK",
  CWS: "CHW",
};

function normalizeMlbAbbr(raw: string | undefined): string {
  const up = (raw || "").toUpperCase();
  return STATS_API_TEAM_ABBR_OVERRIDES[up] || up;
}

export async function fetchMlbGamePks(
  isoDate: string,
): Promise<Map<string, number>> {
  // key: "AWAY|HOME" using normalized abbreviations
  try {
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${isoDate}`;
    const res = await fetch(url);
    if (!res.ok) return new Map();
    const j: StatsApiSchedule = await res.json();
    const map = new Map<string, number>();
    for (const day of j.dates || []) {
      for (const g of day.games || []) {
        const away = normalizeMlbAbbr(g.teams?.away?.team?.abbreviation);
        const home = normalizeMlbAbbr(g.teams?.home?.team?.abbreviation);
        if (away && home) map.set(`${away}|${home}`, g.gamePk);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

// ── WNBA gameId lookup ──────────────────────────────────────────────────────
// wnba.com/game/{gameId} is the most specific watch URL. The static schedule
// CDN exposes a `gameCode` like "20260521/GSVNYL" — date + away triCode +
// home triCode. We map ESPN's 2-letter abbreviations to WNBA's 3-letter
// triCodes so a lookup against the schedule succeeds.

const ESPN_TO_WNBA_TRI: Record<string, string> = {
  CONN: "CON",
  GS: "GSV",
  LV: "LVA",
  LA: "LAS",
  NY: "NYL",
  WSH: "WAS",
};

export function espnToWnbaTri(abbr: string | undefined): string {
  const up = (abbr || "").toUpperCase();
  return ESPN_TO_WNBA_TRI[up] || up;
}

/**
 * Returns a Map keyed by gameCode ("20260521/GSVNYL") → gameId. The
 * upstream WNBA CDN doesn't send CORS headers, so we hit our own proxy
 * at `/api/wnba-schedule` which mirrors the data with CORS + caching.
 */
export async function fetchWnbaGameIds(): Promise<Map<string, string>> {
  try {
    const res = await fetch("/api/wnba-schedule");
    if (!res.ok) return new Map();
    const j: Record<string, string> = await res.json();
    return new Map(Object.entries(j));
  } catch {
    return new Map();
  }
}

// ── Watch links ─────────────────────────────────────────────────────────────

export interface WatchTarget {
  href: string;
  label: string;
}

export function watchRecordingUrl(opts: {
  league: string;
  awayAbbr?: string;
  homeAbbr?: string;
  isoDate?: string; // YYYY-MM-DD, used for NBA daily listing + WNBA gameCode
  mlbGamePks?: Map<string, number>;
  wnbaGameIds?: Map<string, string>;
}): WatchTarget {
  if (opts.league === "baseball/mlb") {
    const key = `${(opts.awayAbbr || "").toUpperCase()}|${(opts.homeAbbr || "").toUpperCase()}`;
    const gamePk = opts.mlbGamePks?.get(key);
    if (gamePk) {
      return { href: `https://www.mlb.com/tv/g${gamePk}`, label: "MLB.tv" };
    }
    return { href: "https://www.mlb.com/tv", label: "MLB.tv" };
  }
  if (opts.league === "basketball/nba") {
    if (opts.isoDate) {
      return {
        href: `https://www.nba.com/games?date=${opts.isoDate}`,
        label: "League Pass",
      };
    }
    return { href: "https://www.nba.com/games", label: "League Pass" };
  }
  if (opts.league === "basketball/wnba") {
    if (opts.isoDate && opts.wnbaGameIds) {
      const awayTri = espnToWnbaTri(opts.awayAbbr);
      const homeTri = espnToWnbaTri(opts.homeAbbr);
      const code = `${opts.isoDate.replace(/-/g, "")}/${awayTri}${homeTri}`;
      const gameId = opts.wnbaGameIds.get(code);
      if (gameId) {
        return {
          href: `https://www.wnba.com/game/${gameId}`,
          label: "WNBA League Pass",
        };
      }
    }
    return {
      href: "https://www.wnba.com/league-pass-stream/",
      label: "WNBA League Pass",
    };
  }
  return { href: "https://tv.youtube.com/", label: "YouTube TV" };
}
