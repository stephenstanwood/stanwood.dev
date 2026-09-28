import { fetchWithTimeout } from "./apiHelpers";
import { ESPN_SPORTS_BASE } from "./sportsCore";
import { awayHomeOf, isoDateInPT, teamSideOf, watchRecordingUrl, type ESPNEvent } from "./wtwtwSports";
import { bestReplay, latestFinal, nbaReplayReadyAt, nflReplayUrl, nflWeekendDates, type ReplayCard, type ReplayFeed, type ReplaySlot } from "./tvReplays";
import { MS_PER_DAY } from "./time";

async function json(url: string): Promise<any> {
  const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 8000);
  if (!res.ok) throw new Error(`Sports upstream ${res.status}`);
  return res.json();
}

/** Schedule scores are objects and logos are arrays; scoreboards use strings and a URL. */
export function normalizeScheduleEvent(raw: any): ESPNEvent {
  return {
    ...raw,
    season: { ...raw.season, type: raw.seasonType?.type ?? raw.season?.type },
    competitions: (raw.competitions ?? []).map((c: any) => ({
      ...c,
      competitors: (c.competitors ?? []).map((side: any) => ({
        ...side,
        score: typeof side.score === "object" ? side.score?.displayValue ?? String(side.score?.value ?? "") : side.score,
        team: { ...side.team, logo: side.team?.logo ?? side.team?.logos?.[0]?.href },
      })),
    })),
  };
}

async function teamSchedule(league: string, team: string, previousSeason = false): Promise<ESPNEvent[]> {
  const url = `${ESPN_SPORTS_BASE}/${league}/teams/${team}/schedule`;
  const data = await json(url);
  if (!Array.isArray(data.events)) throw new Error("Missing team schedule");
  let events = data.events.map(normalizeScheduleEvent);
  if (previousSeason && !latestFinal(events) && data.season?.year) {
    const old = await json(`${url}?season=${data.season.year - 1}`);
    events = [...events, ...(old.events ?? []).map(normalizeScheduleEvent)];
  }
  return events;
}

async function boards(league: string, dates: string[]): Promise<ESPNEvent[]> {
  // A bounded fan-out; the endpoint and process cache keep this off every client.
  const results = await Promise.all(dates.map(async date => {
    const data = await json(`${ESPN_SPORTS_BASE}/${league}/scoreboard?dates=${date.replaceAll("-", "")}`);
    if (!Array.isArray(data.events)) throw new Error("Missing scoreboard");
    return data.events as ESPNEvent[];
  }));
  return [...new Map(results.flat().map(e => [e.id ?? e.date + e.name, e])).values()];
}

async function recentBasketball(league: string, now: Date): Promise<ESPNEvent[]> {
  const dates = Array.from({ length: 3 }, (_, i) => isoDateInPT(new Date(+now - i * MS_PER_DAY)));
  let events = await boards(league, dates);
  if (!latestFinal(events, now)) {
    // Off-days and All-Star breaks: one extra bounded batch, not a vanished tile.
    events = [...events, ...await boards(league, Array.from({ length: 5 }, (_, i) => isoDateInPT(new Date(+now - (i + 3) * MS_PER_DAY))))];
  }
  return events;
}

function card(slot: ReplaySlot, league: string, event: ESPNEvent | undefined, href: string, service: string, note: string): ReplayCard {
  const sides = event && awayHomeOf(event);
  return { slot, game: event && sides ? {
    id: event.id ?? event.date, date: event.date, league,
    away: teamSideOf(sides.away), home: teamSideOf(sides.home), href, service, note,
  } : null };
}

async function nflCards(now: Date): Promise<ReplayCard[]> {
  const [pit, sf, currentWeekend] = await Promise.all([
    teamSchedule("football/nfl", "pit", true), teamSchedule("football/nfl", "sf", true),
    boards("football/nfl", nflWeekendDates(now)),
  ]);
  // Sunday morning (or a Thursday game involving a favorite) must not erase last week's pick.
  const weekend = bestReplay(currentWeekend, "football/nfl", ["PIT", "SF"], now) ? currentWeekend :
    await boards("football/nfl", nflWeekendDates(new Date(+now - 7 * MS_PER_DAY)));
  const picks = [latestFinal(pit, now), latestFinal(sf, now), bestReplay(weekend, "football/nfl", ["PIT", "SF"], now)];
  return (["steelers", "49ers", "nfl-best"] as const).map((slot, i) =>
    card(slot, "football/nfl", picks[i], picks[i] ? nflReplayUrl(picks[i]!) : "", "NFL+ Premium", "Select Full Game Replay"),
  );
}

async function wnbaCards(now: Date): Promise<ReplayCard[]> {
  const [schedule, currentOfficial] = await Promise.all([
    teamSchedule("basketball/wnba", "gs", true),
    json(`https://www.wnba.com/api/schedule?season=${now.getUTCFullYear()}&regionId=1`).catch(() => null),
  ]);
  const favorite = latestFinal(schedule, now);
  const season = favorite ? new Date(favorite.date).getUTCFullYear() : now.getUTCFullYear();
  const official = season === now.getUTCFullYear() ? currentOfficial :
    await json(`https://www.wnba.com/api/schedule?season=${season}&regionId=1`).catch(() => null);
  const gameIds = new Map<string, string>();
  for (const seasonSchedule of [currentOfficial, official]) {
    for (const day of seasonSchedule?.leagueSchedule?.gameDates ?? []) {
      for (const game of day.games ?? []) if (game.gameCode && game.gameId) gameIds.set(game.gameCode, game.gameId);
    }
  }
  // Published schedule dates retain the latest league slate even after a
  // favorite is eliminated and throughout the off-season.
  const dates = [...new Set([...gameIds.keys()].filter(code => !code.slice(9).includes("GSV")).map(code => code.slice(0, 8)))]
    .filter(date => /^\d{8}$/.test(date) && date <= isoDateInPT(now).replaceAll("-", ""))
    .sort().reverse().slice(0, 3);
  const events = dates.length ? await boards("basketball/wnba", dates) :
    await recentBasketball("basketball/wnba", favorite ? new Date(Math.max(+new Date(favorite.date), +now - 7 * MS_PER_DAY)) : now);
  const picks = [favorite, bestReplay(events, "basketball/wnba", ["GS", "GSV"], now)];
  return (["valkyries", "wnba-best"] as const).map((slot, i) => {
    const event = picks[i], sides = event && awayHomeOf(event);
    const watch = watchRecordingUrl({ league: "basketball/wnba", awayAbbr: sides?.away.team?.abbreviation,
      homeAbbr: sides?.home.team?.abbreviation, isoDate: event ? isoDateInPT(new Date(event.date)) : undefined, wnbaGameIds: gameIds });
    return card(slot, "basketball/wnba", event, watch.href, watch.label, "Full game replay");
  });
}

async function cubsCard(now: Date): Promise<ReplayCard[]> {
  const event = latestFinal(await teamSchedule("baseball/mlb", "chc", true), now);
  if (!event) return [{ slot: "cubs", game: null }];
  const date = isoDateInPT(new Date(event.date));
  const official = await json(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=112&date=${date}`);
  // Doubleheaders: match the start time, not merely the two clubs.
  const games = (official.dates ?? []).flatMap((d: any) => d.games ?? []);
  const game = games.sort((a: any, b: any) => Math.abs(Date.parse(a.gameDate) - Date.parse(event.date)) - Math.abs(Date.parse(b.gameDate) - Date.parse(event.date)))[0];
  return [card("cubs", "baseball/mlb", event, game ? `https://www.mlb.com/tv/g${game.gamePk}` : `https://www.mlb.com/tv?date=${date}`, "MLB.tv", "Full game replay")];
}

const NBA_TRI: Record<string, string> = { GS: "GSW", NY: "NYK", NO: "NOP", SA: "SAS", UTAH: "UTA", WSH: "WAS" };
/** Read game IDs from NBA's published game cards, never synthesize an ESPN ID. */
export function nbaGamesFromPage(html: string): any[] {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  const found = new Map<string, any>();
  function walk(value: any) {
    if (!value || typeof value !== "object") return;
    if (value.gameId && value.awayTeam?.teamTricode && value.homeTeam?.teamTricode) found.set(value.gameId, value);
    for (const child of Object.values(value)) if (typeof child === "object") walk(child);
  }
  walk(JSON.parse(match[1]));
  return [...found.values()];
}

async function nbaCards(now: Date): Promise<ReplayCard[]> {
  const schedule = await teamSchedule("basketball/nba", "gs");
  // Do not turn last spring or Summer League into the promised upcoming NBA row.
  const hasSeasonStarted = schedule.some(e => Date.parse(e.date) <= +now);
  if (!hasSeasonStarted) return ["warriors", "nba-best"].map(slot => ({ slot: slot as ReplaySlot, game: null, empty: "League Pass · next season's full replays appear here" }));
  const events = await recentBasketball("basketball/nba", now);
  const ready = (e: ESPNEvent) => nbaReplayReadyAt(e) <= +now;
  const picks = [latestFinal(schedule.filter(ready), now), bestReplay(events.filter(ready), "basketball/nba", ["GS", "GSW"], now)];
  const dates = [...new Set(picks.filter(Boolean).map(e => isoDateInPT(new Date(e!.date))))];
  const maps = new Map<string, any[]>();
  await Promise.all(dates.map(async date => {
    const res = await fetchWithTimeout(`https://www.nba.com/games?date=${date}`, {}, 8000);
    if (!res.ok) throw new Error(`NBA game pages ${res.status}`);
    maps.set(date, nbaGamesFromPage(await res.text()));
  }));
  return (["warriors", "nba-best"] as const).map((slot, i) => {
    const e = picks[i];
    if (!e) return { slot, game: null, empty: "Waiting for a full replay · local blackouts may delay it" };
    const sides = awayHomeOf(e)!;
    const abbr = (s: string) => NBA_TRI[s] ?? s;
    const a = abbr(sides.away.team?.abbreviation ?? ""), h = abbr(sides.home.team?.abbreviation ?? "");
    const date = isoDateInPT(new Date(e.date));
    const game = maps.get(date)?.find(g => g.awayTeam.teamTricode === a && g.homeTeam.teamTricode === h);
    const href = game ? `https://www.nba.com/game/${a.toLowerCase()}-vs-${h.toLowerCase()}-${game.gameId}` : `https://www.nba.com/games?date=${date}`;
    return card(slot, "basketball/nba", e, href, "NBA League Pass", "Full replay · choose the edited broadcast");
  });
}

let cache: { feed: ReplayFeed; expires: number } | undefined;
let pending: Promise<ReplayFeed> | undefined;
export async function loadReplayFeed(now = new Date()): Promise<ReplayFeed> {
  if (cache && cache.expires > +now) return cache.feed;
  if (pending) return pending;
  pending = (async () => {
    const groups: [ReplaySlot[], () => Promise<ReplayCard[]>][] = [
      [["steelers", "49ers", "nfl-best"], () => nflCards(now)],
      [["valkyries", "wnba-best"], () => wnbaCards(now)],
      [["cubs"], () => cubsCard(now)], [["warriors", "nba-best"], () => nbaCards(now)],
    ];
    const results = await Promise.all(groups.map(async ([slots, load]) => {
      try { return await load(); }
      catch (error) {
        console.error(`TV replays ${slots.join(",")}:`, error);
        return slots.map(slot => ({ slot, game: cache?.feed.cards.find(c => c.slot === slot)?.game ?? null, unavailable: true }));
      }
    }));
    const feed = { cards: results.flat(), builtAt: now.toISOString() };
    cache = { feed, expires: +now + 5 * 60 * 1000 };
    return feed;
  })();
  try { return await pending; } finally { pending = undefined; }
}
