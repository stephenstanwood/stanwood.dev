import { describe, expect, it } from "vitest";
import { bestReplay, latestFinal, nbaReplayReadyAt, nflReplayUrl, nflWatchScore, nflWeekendDates, REPLAY_SLOTS, TV_TEAM_KEYS } from "./tvReplays";
import { nbaGamesFromPage, normalizeScheduleEvent } from "./tvReplaysServer";
import type { ESPNEvent } from "./wtwtwSports";

const now = new Date("2026-09-28T21:00:00Z");
function game(id: string, away = "SEA", home = "WSH", margin = 3, date = "2026-09-27T20:00:00Z"): ESPNEvent {
  return { id, date, season: { year: 2026, type: 2 }, week: { number: 3 }, competitions: [{
    status: { period: 4, type: { state: "post", completed: true } },
    competitors: [
      { homeAway: "away", team: { abbreviation: away }, score: "24", records: [{ summary: "2-1" }] },
      { homeAway: "home", team: { abbreviation: home }, score: String(24 + margin), records: [{ summary: "2-1" }] },
    ],
  }] };
}
describe("TV replay queue", () => {
  it("keeps the requested fixed slots and omits unwanted baseball teams", () => {
    expect(REPLAY_SLOTS.map(s => s[0])).toEqual(["steelers", "49ers", "nfl-best", "valkyries", "wnba-best", "cubs", "warriors", "nba-best"]);
    expect(TV_TEAM_KEYS).not.toContain("mlb-giants");
    expect(TV_TEAM_KEYS).not.toContain("mlb-athletics");
  });
  it("retains a final through a bye, scheduled game and in-progress replacement", () => {
    const old = game("old", "CIN", "PIT", 3, "2026-09-13T17:00:00Z");
    const live = game("live", "PIT", "NE");
    live.competitions![0].status!.type = { state: "in", completed: false };
    const upcoming = game("pre", "PIT", "CLE", 0, "2026-10-01T17:00:00Z");
    upcoming.competitions![0].status!.type = { state: "pre" };
    expect(latestFinal([live, old, upcoming], now)?.id).toBe("old");
    live.competitions![0].status!.type = { state: "post", completed: true };
    expect(latestFinal([live, old], now)?.id).toBe("live");
  });
  it("ignores postponed games and malformed matchups", () => {
    const bad = game("postponed");
    bad.competitions![0].status!.type!.name = "STATUS_POSTPONED";
    expect(latestFinal([bad, { ...game("bad"), competitions: [] }], now)).toBeUndefined();
  });
  it("uses Pacific weekend boundaries and retains that weekend later in the week", () => {
    expect(nflWeekendDates(now)).toEqual(["2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"]);
    expect(nflWeekendDates(new Date("2026-10-02T12:00Z"))).toEqual(nflWeekendDates(now));
    expect(nflWeekendDates(new Date("2026-09-27T06:00Z"))).toContain("2026-09-20");
  });
  it("excludes every Steelers and 49ers matchup from the league pick", () => {
    expect(bestReplay([game("pit", "PIT", "CIN", 0), game("sf", "ARI", "SF", 0), game("other")], "football/nfl", ["PIT", "SF"], now)?.id).toBe("other");
  });
  it("prefers a competitive game over a blowout and rewards OT", () => {
    const close = game("close"), blowout = game("blowout", "KC", "MIA", 28), ot = game("ot");
    ot.competitions![0].status!.period = 5;
    expect(nflWatchScore(close)).toBeGreaterThan(nflWatchScore(blowout));
    expect(nflWatchScore(ot)).toBeGreaterThan(nflWatchScore(close));
  });
  it("uses the latest eligible basketball slate without duplicating a favorite", () => {
    const old = game("old", "IND", "CHI", 1, "2026-09-25T20:00Z");
    expect(bestReplay([old, game("valks", "GS", "DAL", 0), game("other", "WSH", "ATL", 8)], "basketball/wnba", ["GS"], now)?.id).toBe("other");
  });
  it("constructs NFL game slugs from season metadata rather than calendar year", () => {
    const e = game("pit", "CIN", "PIT");
    expect(nflReplayUrl(e)).toBe("https://www.nfl.com/games/bengals-at-steelers-2026-reg-3?tab=highlights-replays");
    e.date = "2027-01-05T20:00Z"; e.week = { number: 17 };
    expect(nflReplayUrl(e)).toContain("2026-reg-17");
  });
  it("normalizes the actual ESPN schedule score/logo shape", () => {
    const raw = game("schedule") as any;
    raw.seasonType = { type: 3 };
    raw.competitions[0].competitors[0].score = { value: 24, displayValue: "24" };
    raw.competitions[0].competitors[0].team.logos = [{ href: "https://example.com/logo.png" }];
    const normalized = normalizeScheduleEvent(raw);
    expect(normalized.competitions![0].competitors![0].score).toBe("24");
    expect(normalized.competitions![0].competitors![0].team!.logo).toContain("logo.png");
    expect(normalized.season!.type).toBe(3);
  });
  it("respects local NBA replay delays", () => {
    expect(nbaReplayReadyAt(game("warriors", "GS", "LAL")) - Date.parse(game("warriors").date)).toBe(75 * 3600000);
    expect(nbaReplayReadyAt(game("other", "BOS", "NY")) - Date.parse(game("other").date)).toBe(12 * 3600000);
    const national = game("national", "GS", "LAL");
    national.competitions![0].broadcasts = [{ names: ["NBC"] }];
    expect(nbaReplayReadyAt(national)).toBe(Date.parse("2026-09-28T10:00:00Z"));
    national.date = "2026-12-25T18:00:00Z";
    expect(nbaReplayReadyAt(national)).toBe(Date.parse("2026-12-26T11:00:00Z"));
  });
  it("extracts official NBA IDs and deduplicates cards", () => {
    const g = { gameId: "0022600001", awayTeam: { teamTricode: "GSW" }, homeTeam: { teamTricode: "LAC" } };
    expect(nbaGamesFromPage(`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { cards: [g, g] } })}</script>`)).toHaveLength(1);
    expect(nbaGamesFromPage("unavailable")).toEqual([]);
  });
});
