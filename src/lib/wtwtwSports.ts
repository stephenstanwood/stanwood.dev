// Shared helpers for the /tv sports rails (yesterday recap + today schedule).
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
  broadcasts?: Array<{ names?: string[] }>;
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

export function eventStartSortKey(ev: ESPNEvent): number {
  const ms = Date.parse(ev.date);
  return Number.isFinite(ms) ? ms : 0;
}

export function eventHasStarted(ev: ESPNEvent): boolean {
  const t = ev.competitions?.[0]?.status?.type;
  if (t?.completed) return true;
  if (t?.state === "in" || t?.state === "post") return true;
  if ((t?.name || "").includes("IN_PROGRESS")) return true;
  return false;
}

export function broadcastsOf(ev: ESPNEvent): string[] {
  const out: string[] = [];
  for (const b of ev.competitions?.[0]?.broadcasts || []) {
    for (const n of b.names || []) out.push(n);
  }
  return out;
}

export function matchUserTeam(
  ev: ESPNEvent,
  league: string,
  lookup: Map<string, TeamEntry>,
): TeamEntry | null {
  return matchUserTeams(ev, league, lookup)[0] || null;
}

export function matchUserTeams(
  ev: ESPNEvent,
  league: string,
  lookup: Map<string, TeamEntry>,
): TeamEntry[] {
  const out: TeamEntry[] = [];
  const seen = new Set<string>();
  const cs = ev.competitions?.[0]?.competitors || [];
  for (const c of cs) {
    const abbr = (c.team?.abbreviation || "").toUpperCase();
    const t = lookup.get(`${league}|${abbr}`);
    if (t && !seen.has(t.key)) {
      seen.add(t.key);
      out.push(t);
    }
  }
  return out;
}

export function trackedEventTeamKeys(
  ev: ESPNEvent,
  league: string,
  lookup: Map<string, TeamEntry>,
): string[] {
  const out = new Set<string>();
  for (const t of matchUserTeams(ev, league, lookup)) out.add(t.key);

  if (league === "basketball/nba" && isNbaPlayoff(ev)) {
    for (const c of ev.competitions?.[0]?.competitors || []) {
      const abbr = (c.team?.abbreviation || "").toUpperCase();
      if (abbr) out.add(`${league}|${abbr}`);
    }
  }

  return [...out];
}

export function latestStartedAtByTrackedTeam(
  games: Iterable<{ league: string; event: ESPNEvent }>,
  lookup: Map<string, TeamEntry>,
): Map<string, number> {
  const latest = new Map<string, number>();
  for (const { league, event } of games) {
    if (!eventHasStarted(event)) continue;
    const startSortKey = eventStartSortKey(event);
    if (!startSortKey) continue;

    for (const key of trackedEventTeamKeys(event, league, lookup)) {
      const prev = latest.get(key) || 0;
      if (startSortKey > prev) latest.set(key, startSortKey);
    }
  }
  return latest;
}

export function isLatestStartedEventForTrackedTeams(
  ev: ESPNEvent,
  league: string,
  lookup: Map<string, TeamEntry>,
  latestStartedAtByTeam: Map<string, number>,
): boolean {
  const keys = trackedEventTeamKeys(ev, league, lookup);
  const startSortKey = eventStartSortKey(ev);
  return (
    keys.length > 0 &&
    startSortKey > 0 &&
    keys.every((key) => latestStartedAtByTeam.get(key) === startSortKey)
  );
}

/** YYYY-MM-DD for MLB StatsAPI, computed in Pacific Time. */
export function isoDateInPT(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

/** YYYYMMDD for ESPN, computed in Pacific Time. */
export function yyyymmddInPT(d: Date): string {
  return isoDateInPT(d).replace(/-/g, "");
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
    away: { team: { id?: number; name?: string; abbreviation?: string } };
    home: { team: { id?: number; name?: string; abbreviation?: string } };
  };
}

interface StatsApiSchedule {
  dates?: Array<{ games?: StatsApiGame[] }>;
}

const STATS_API_TEAM_ABBR_OVERRIDES: Record<string, string> = {
  AZ: "ARI",
  CWS: "CHW",
  OAK: "ATH",
};

const STATS_API_TEAM_ABBR_BY_ID: Record<number, string> = {
  108: "LAA",
  109: "ARI",
  110: "BAL",
  111: "BOS",
  112: "CHC",
  113: "CIN",
  114: "CLE",
  115: "COL",
  116: "DET",
  117: "HOU",
  118: "KC",
  119: "LAD",
  120: "WSH",
  121: "NYM",
  133: "ATH",
  134: "PIT",
  135: "SD",
  136: "SEA",
  137: "SF",
  138: "STL",
  139: "TB",
  140: "TEX",
  141: "TOR",
  142: "MIN",
  143: "PHI",
  144: "ATL",
  145: "CHW",
  146: "MIA",
  147: "NYY",
  158: "MIL",
};

function normalizeMlbAbbr(raw: string | undefined): string {
  const up = (raw || "").toUpperCase();
  return STATS_API_TEAM_ABBR_OVERRIDES[up] || up;
}

function statsApiTeamAbbr(team: StatsApiGame["teams"]["away"]["team"]): string {
  if (typeof team?.id === "number") {
    const mapped = STATS_API_TEAM_ABBR_BY_ID[team.id];
    if (mapped) return mapped;
  }
  return normalizeMlbAbbr(team?.abbreviation);
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
        const away = statsApiTeamAbbr(g.teams?.away?.team);
        const home = statsApiTeamAbbr(g.teams?.home?.team);
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

const PRIME_URL =
  "https://www.amazon.com/gp/video/storefront?ref_=atv_pr_sw_sc";
const YOUTUBE_TV_URL = "https://tv.youtube.com/";
const MLB_TV_ROOT = "https://www.mlb.com/tv";

export function watchRecordingUrl(opts: {
  league: string;
  awayAbbr?: string;
  homeAbbr?: string;
  isoDate?: string; // YYYY-MM-DD, used for NBA daily listing + WNBA gameCode
  isLive?: boolean; // live games route around in-market MLB.tv/League Pass blackouts
  broadcasts?: string[]; // ESPN broadcaster names — drives NBA Prime vs YTTV routing
  matchedKey?: string; // user team key (e.g. "mlb-cubs") for blackout-aware routing
  mlbGamePks?: Map<string, number>;
  wnbaGameIds?: Map<string, string>;
}): WatchTarget {
  // ── LIVE: route around in-market blackouts. Stephen watches the local
  // Giants/Valkyries live on YouTube TV (NBC Sports Bay Area carries them),
  // out-of-market Cubs on MLB.tv, and NBA games by broadcaster (Prime when
  // it's an Amazon broadcast, otherwise cable via YTTV).
  if (opts.isLive) {
    if (opts.league === "basketball/nba") {
      const onPrime = (opts.broadcasts || []).some((b) => /prime/i.test(b));
      return onPrime
        ? { href: PRIME_URL, label: "Prime" }
        : { href: YOUTUBE_TV_URL, label: "YouTube TV" };
    }
    if (opts.matchedKey === "mlb-cubs") {
      return { href: MLB_TV_ROOT, label: "MLB.tv" };
    }
    if (opts.matchedKey === "mlb-giants") {
      return { href: YOUTUBE_TV_URL, label: "YouTube TV" };
    }
    if (opts.matchedKey === "wnba-valkyries") {
      return { href: YOUTUBE_TV_URL, label: "YouTube TV" };
    }
    if (opts.league === "baseball/mlb") {
      return { href: MLB_TV_ROOT, label: "MLB.tv" };
    }
    return { href: YOUTUBE_TV_URL, label: "YouTube TV" };
  }

  // ── REPLAY: deep links into MLB.tv/WNBA game pages or NBA daily listing.
  if (opts.league === "baseball/mlb") {
    const key = `${(opts.awayAbbr || "").toUpperCase()}|${(opts.homeAbbr || "").toUpperCase()}`;
    const gamePk = opts.mlbGamePks?.get(key);
    if (gamePk) {
      return { href: `https://www.mlb.com/tv/g${gamePk}`, label: "MLB.tv" };
    }
    return { href: MLB_TV_ROOT, label: "MLB.tv" };
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
  return { href: YOUTUBE_TV_URL, label: "YouTube TV" };
}
