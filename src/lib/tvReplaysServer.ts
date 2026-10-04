import { fetchWithTimeout } from "./apiHelpers";
import { ESPN_SPORTS_BASE } from "./sportsCore";
import { awayHomeOf, isoDateInPT, teamSideOf, watchRecordingUrl, type ESPNEvent } from "./wtwtwSports";
import { bestReplay, latestFinal, nbaReplayReadyAt, nflReplayUrl, nflWeekendDates, type ReplayCard, type ReplayFeed, type ReplaySlot } from "./tvReplays";
import { MS_PER_DAY } from "./time";

// CLEANUP-FLAG: this feed relies on unchecked ESPN, WNBA, MLB, and NBA payload
// shapes. Shared validation would touch every league and its fallback behavior.
async function fetchSportsJson(url: string): Promise<any> {
  const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 8000);
  if (!response.ok) throw new Error(`Sports upstream ${response.status}`);
  return response.json();
}

function normalizeScheduleScore(score: any) {
  if (typeof score !== "object") return score;
  return score?.displayValue ?? String(score?.value ?? "");
}

/** Schedule scores are objects and logos are arrays; scoreboards use strings and a URL. */
export function normalizeScheduleEvent(raw: any): ESPNEvent {
  return {
    ...raw,
    season: { ...raw.season, type: raw.seasonType?.type ?? raw.season?.type },
    competitions: (raw.competitions ?? []).map((competition: any) => ({
      ...competition,
      competitors: (competition.competitors ?? []).map((side: any) => ({
        ...side,
        score: normalizeScheduleScore(side.score),
        team: { ...side.team, logo: side.team?.logo ?? side.team?.logos?.[0]?.href },
      })),
    })),
  };
}

async function fetchTeamSchedule(league: string, team: string, previousSeason = false): Promise<ESPNEvent[]> {
  const url = `${ESPN_SPORTS_BASE}/${league}/teams/${team}/schedule`;
  const data = await fetchSportsJson(url);
  if (!Array.isArray(data.events)) throw new Error("Missing team schedule");
  let events = data.events.map(normalizeScheduleEvent);
  if (previousSeason && !latestFinal(events) && data.season?.year) {
    const previousSchedule = await fetchSportsJson(`${url}?season=${data.season.year - 1}`);
    events = [...events, ...(previousSchedule.events ?? []).map(normalizeScheduleEvent)];
  }
  return events;
}

async function fetchScoreboards(league: string, dates: string[]): Promise<ESPNEvent[]> {
  // A bounded fan-out; the endpoint and process cache keep this off every client.
  const results = await Promise.all(dates.map(async date => {
    const data = await fetchSportsJson(`${ESPN_SPORTS_BASE}/${league}/scoreboard?dates=${date.replaceAll("-", "")}`);
    if (!Array.isArray(data.events)) throw new Error("Missing scoreboard");
    return data.events as ESPNEvent[];
  }));
  return [...new Map(results.flat().map(event => [event.id ?? event.date + event.name, event])).values()];
}

async function recentBasketball(league: string, now: Date): Promise<ESPNEvent[]> {
  const dates = Array.from({ length: 3 }, (_, i) => isoDateInPT(new Date(+now - i * MS_PER_DAY)));
  let events = await fetchScoreboards(league, dates);
  if (!latestFinal(events, now)) {
    // Off-days and All-Star breaks: one extra bounded batch, not a vanished tile.
    const earlierDates = Array.from({ length: 5 }, (_, i) => isoDateInPT(new Date(+now - (i + 3) * MS_PER_DAY)));
    events = [...events, ...await fetchScoreboards(league, earlierDates)];
  }
  return events;
}

function buildReplayCard(slot: ReplaySlot, league: string, event: ESPNEvent | undefined, href: string, service: string, note: string): ReplayCard {
  const sides = event && awayHomeOf(event);
  if (!event || !sides) return { slot, game: null };
  return {
    slot,
    game: {
      id: event.id ?? event.date, date: event.date, league,
      away: teamSideOf(sides.away), home: teamSideOf(sides.home), href, service, note,
    },
  };
}

async function nflCards(now: Date): Promise<ReplayCard[]> {
  const [pit, sf, currentWeekend] = await Promise.all([
    fetchTeamSchedule("football/nfl", "pit", true), fetchTeamSchedule("football/nfl", "sf", true),
    fetchScoreboards("football/nfl", nflWeekendDates(now)),
  ]);
  // Sunday morning (or a Thursday game involving a favorite) must not erase last week's pick.
  let weekend = currentWeekend;
  if (!bestReplay(currentWeekend, "football/nfl", ["PIT", "SF"], now)) {
    weekend = await fetchScoreboards("football/nfl", nflWeekendDates(new Date(+now - 7 * MS_PER_DAY)));
  }
  const picks = [latestFinal(pit, now), latestFinal(sf, now), bestReplay(weekend, "football/nfl", ["PIT", "SF"], now)];
  return (["steelers", "49ers", "nfl-best"] as const).map((slot, i) =>
    buildReplayCard(slot, "football/nfl", picks[i], picks[i] ? nflReplayUrl(picks[i]!) : "", "NFL+ Premium", "Select Full Game Replay"),
  );
}

async function fetchWnbaSchedule(season: number): Promise<any> {
  return fetchSportsJson(`https://www.wnba.com/api/schedule?season=${season}&regionId=1`).catch(() => null);
}

async function wnbaCards(now: Date): Promise<ReplayCard[]> {
  const [schedule, currentOfficial] = await Promise.all([
    fetchTeamSchedule("basketball/wnba", "gs", true),
    fetchWnbaSchedule(now.getUTCFullYear()),
  ]);
  const favorite = latestFinal(schedule, now);
  const season = favorite ? new Date(favorite.date).getUTCFullYear() : now.getUTCFullYear();
  let official = currentOfficial;
  if (season !== now.getUTCFullYear()) {
    official = await fetchWnbaSchedule(season);
  }
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
  let events: ESPNEvent[];
  if (dates.length) {
    events = await fetchScoreboards("basketball/wnba", dates);
  } else {
    const recentStart = favorite ? new Date(Math.max(+new Date(favorite.date), +now - 7 * MS_PER_DAY)) : now;
    events = await recentBasketball("basketball/wnba", recentStart);
  }
  const picks = [favorite, bestReplay(events, "basketball/wnba", ["GS", "GSV"], now)];
  return (["valkyries", "wnba-best"] as const).map((slot, i) => {
    const event = picks[i], sides = event && awayHomeOf(event);
    const watch = watchRecordingUrl({ league: "basketball/wnba", awayAbbr: sides?.away.team?.abbreviation,
      homeAbbr: sides?.home.team?.abbreviation, isoDate: event ? isoDateInPT(new Date(event.date)) : undefined, wnbaGameIds: gameIds });
    return buildReplayCard(slot, "basketball/wnba", event, watch.href, watch.label, "Full game replay");
  });
}

async function cubsCard(now: Date): Promise<ReplayCard[]> {
  const event = latestFinal(await fetchTeamSchedule("baseball/mlb", "chc", true), now);
  if (!event) return [{ slot: "cubs", game: null }];
  const date = isoDateInPT(new Date(event.date));
  const official = await fetchSportsJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=112&date=${date}`);
  // Doubleheaders: match the start time, not merely the two clubs.
  const games = (official.dates ?? []).flatMap((day: any) => day.games ?? []);
  const game = games.sort((a: any, b: any) => Math.abs(Date.parse(a.gameDate) - Date.parse(event.date)) - Math.abs(Date.parse(b.gameDate) - Date.parse(event.date)))[0];
  return [buildReplayCard("cubs", "baseball/mlb", event, game ? `https://www.mlb.com/tv/g${game.gamePk}` : `https://www.mlb.com/tv?date=${date}`, "MLB.tv", "Full game replay")];
}

const NBA_TRI: Record<string, string> = { GS: "GSW", NY: "NYK", NO: "NOP", SA: "SAS", UTAH: "UTA", WSH: "WAS" };
const NBA_REPLAY_SLOTS = ["warriors", "nba-best"] as const;
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
  const schedule = await fetchTeamSchedule("basketball/nba", "gs");
  // Do not turn last spring or Summer League into the promised upcoming NBA row.
  const hasSeasonStarted = schedule.some(event => Date.parse(event.date) <= +now);
  if (!hasSeasonStarted) return NBA_REPLAY_SLOTS.map(slot => ({ slot, game: null, empty: "League Pass · next season's full replays appear here" }));
  const events = await recentBasketball("basketball/nba", now);
  const ready = (event: ESPNEvent) => nbaReplayReadyAt(event) <= +now;
  const picks = [latestFinal(schedule.filter(ready), now), bestReplay(events.filter(ready), "basketball/nba", ["GS", "GSW"], now)];
  const dates = [...new Set(picks.filter(Boolean).map(event => isoDateInPT(new Date(event!.date))))];
  const gamesByDate = new Map<string, any[]>();
  await Promise.all(dates.map(async date => {
    const response = await fetchWithTimeout(`https://www.nba.com/games?date=${date}`, {}, 8000);
    if (!response.ok) throw new Error(`NBA game pages ${response.status}`);
    gamesByDate.set(date, nbaGamesFromPage(await response.text()));
  }));
  return NBA_REPLAY_SLOTS.map((slot, i) => {
    const event = picks[i];
    if (!event) return { slot, game: null, empty: "Waiting for a full replay · local blackouts may delay it" };
    const sides = awayHomeOf(event)!;
    const tricode = (abbreviation: string) => NBA_TRI[abbreviation] ?? abbreviation;
    const awayTricode = tricode(sides.away.team?.abbreviation ?? "");
    const homeTricode = tricode(sides.home.team?.abbreviation ?? "");
    const date = isoDateInPT(new Date(event.date));
    const game = gamesByDate.get(date)?.find(game => game.awayTeam.teamTricode === awayTricode && game.homeTeam.teamTricode === homeTricode);
    let href = `https://www.nba.com/games?date=${date}`;
    if (game) {
      href = `https://www.nba.com/game/${awayTricode.toLowerCase()}-vs-${homeTricode.toLowerCase()}-${game.gameId}`;
    }
    return buildReplayCard(slot, "basketball/nba", event, href, "NBA League Pass", "Full replay · choose the edited broadcast");
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
