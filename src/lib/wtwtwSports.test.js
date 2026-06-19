import { describe, expect, it } from "vitest";
import {
  ALWAYS_SHOW_TEAMS,
  bestUnseenFinishedGame,
  buildTeamLookup,
  isFinalEvent,
  isLatestStartedEventForTrackedTeams,
  isPostponedLike,
  latestStartedAtByTrackedTeam,
  watchRecordingUrl,
} from "./wtwtwSports";
import { getTeam } from "./teamRegistry";

function event({
  id,
  date,
  away,
  home,
  state,
  completed = false,
  playoff = false,
  awayScore = "80",
  homeScore = "75",
  awayRecord = "10-10",
  homeRecord = "10-10",
  period = 4,
  name = state === "in" ? "STATUS_IN_PROGRESS" : undefined,
}) {
  return {
    id,
    date,
    season: playoff ? { type: 3, slug: "post-season" } : undefined,
    competitions: [
      {
        status: {
          period,
          type: {
            state,
            completed,
            name,
          },
        },
        competitors: [
          {
            homeAway: "away",
            team: { abbreviation: away },
            score: awayScore,
            records: [{ summary: awayRecord }],
          },
          {
            homeAway: "home",
            team: { abbreviation: home },
            score: homeScore,
            records: [{ summary: homeRecord }],
          },
        ],
      },
    ],
  };
}

function latestMap(events, lookup) {
  return latestStartedAtByTrackedTeam(events, lookup);
}

describe("sports recap team freshness", () => {
  it("tracks the Athletics as one of Stephen's default TV teams", () => {
    const team = getTeam("mlb-athletics");
    const lookup = buildTeamLookup(ALWAYS_SHOW_TEAMS);

    expect(ALWAYS_SHOW_TEAMS).toContain("mlb-athletics");
    expect(team?.fullName).toBe("Athletics");
    expect(team?.abbreviation).toBe("ATH");
    expect(lookup.get("baseball/mlb|ATH")?.key).toBe("mlb-athletics");
  });

  it("keeps an Athletics final visible when the next game is only scheduled", () => {
    const lookup = buildTeamLookup(ALWAYS_SHOW_TEAMS);
    const yesterdayFinal = event({
      id: "ath-final",
      date: "2026-05-24T20:10:00Z",
      away: "ATH",
      home: "SD",
      state: "post",
      completed: true,
    });
    const todayScheduled = event({
      id: "ath-scheduled",
      date: "2026-05-26T01:40:00Z",
      away: "SEA",
      home: "ATH",
      state: "pre",
    });

    const latest = latestMap(
      [
        { league: "baseball/mlb", event: yesterdayFinal },
        { league: "baseball/mlb", event: todayScheduled },
      ],
      lookup,
    );

    expect(
      isLatestStartedEventForTrackedTeams(
        yesterdayFinal,
        "baseball/mlb",
        lookup,
        latest,
      ),
    ).toBe(true);
    expect(
      isLatestStartedEventForTrackedTeams(
        todayScheduled,
        "baseball/mlb",
        lookup,
        latest,
      ),
    ).toBe(false);
  });

  it("keeps only the latest started Valkyries final", () => {
    const lookup = buildTeamLookup(["wnba-valkyries"]);
    const oldFinal = event({
      id: "old",
      date: "2026-05-21T23:00:00Z",
      away: "GS",
      home: "IND",
      state: "post",
      completed: true,
    });
    const newFinal = event({
      id: "new",
      date: "2026-05-22T23:00:00Z",
      away: "GS",
      home: "NY",
      state: "post",
      completed: true,
    });

    const latest = latestMap(
      [
        { league: "basketball/wnba", event: oldFinal },
        { league: "basketball/wnba", event: newFinal },
      ],
      lookup,
    );

    expect(
      isLatestStartedEventForTrackedTeams(
        oldFinal,
        "basketball/wnba",
        lookup,
        latest,
      ),
    ).toBe(false);
    expect(
      isLatestStartedEventForTrackedTeams(
        newFinal,
        "basketball/wnba",
        lookup,
        latest,
      ),
    ).toBe(true);
  });

  it("does not clear the previous recap for a merely scheduled game", () => {
    const lookup = buildTeamLookup(["wnba-valkyries"]);
    const oldFinal = event({
      id: "old",
      date: "2026-05-21T23:00:00Z",
      away: "GS",
      home: "IND",
      state: "post",
      completed: true,
    });
    const upcoming = event({
      id: "upcoming",
      date: "2026-05-22T23:00:00Z",
      away: "GS",
      home: "NY",
      state: "pre",
    });

    const latest = latestMap(
      [
        { league: "basketball/wnba", event: oldFinal },
        { league: "basketball/wnba", event: upcoming },
      ],
      lookup,
    );

    expect(
      isLatestStartedEventForTrackedTeams(
        oldFinal,
        "basketball/wnba",
        lookup,
        latest,
      ),
    ).toBe(true);
    expect(
      isLatestStartedEventForTrackedTeams(
        upcoming,
        "basketball/wnba",
        lookup,
        latest,
      ),
    ).toBe(false);
  });

  it("clears the previous recap once the newer game is live", () => {
    const lookup = buildTeamLookup(["wnba-valkyries"]);
    const oldFinal = event({
      id: "old",
      date: "2026-05-21T23:00:00Z",
      away: "GS",
      home: "IND",
      state: "post",
      completed: true,
    });
    const live = event({
      id: "live",
      date: "2026-05-22T23:00:00Z",
      away: "GS",
      home: "NY",
      state: "in",
    });

    const latest = latestMap(
      [
        { league: "basketball/wnba", event: oldFinal },
        { league: "basketball/wnba", event: live },
      ],
      lookup,
    );

    expect(
      isLatestStartedEventForTrackedTeams(
        oldFinal,
        "basketball/wnba",
        lookup,
        latest,
      ),
    ).toBe(false);
    expect(
      isLatestStartedEventForTrackedTeams(
        live,
        "basketball/wnba",
        lookup,
        latest,
      ),
    ).toBe(true);
  });

  it("applies the same freshness rule to auto-shown NBA playoff teams", () => {
    const lookup = buildTeamLookup([]);
    const oldFinal = event({
      id: "old-playoff",
      date: "2026-05-21T23:00:00Z",
      away: "CLE",
      home: "NY",
      state: "post",
      completed: true,
      playoff: true,
    });
    const newerLive = event({
      id: "new-playoff",
      date: "2026-05-22T23:00:00Z",
      away: "BOS",
      home: "CLE",
      state: "in",
      playoff: true,
    });

    const latest = latestMap(
      [
        { league: "basketball/nba", event: oldFinal },
        { league: "basketball/nba", event: newerLive },
      ],
      lookup,
    );

    expect(
      isLatestStartedEventForTrackedTeams(
        oldFinal,
        "basketball/nba",
        lookup,
        latest,
      ),
    ).toBe(false);
    expect(
      isLatestStartedEventForTrackedTeams(
        newerLive,
        "basketball/nba",
        lookup,
        latest,
      ),
    ).toBe(true);
  });
});

describe("finished game ranking", () => {
  it("picks the next-best finished game when the overall best is already shown", () => {
    const top = event({
      id: "valks-best",
      date: "2026-06-06T19:00:00Z",
      away: "GS",
      home: "NY",
      state: "post",
      completed: true,
      awayScore: "91",
      homeScore: "90",
      awayRecord: "9-2",
      homeRecord: "8-3",
    });
    const next = event({
      id: "next-best",
      date: "2026-06-06T20:00:00Z",
      away: "LV",
      home: "MIN",
      state: "post",
      completed: true,
      awayScore: "84",
      homeScore: "82",
      awayRecord: "8-4",
      homeRecord: "7-5",
    });
    const blowout = event({
      id: "blowout",
      date: "2026-06-06T18:00:00Z",
      away: "PHX",
      home: "DAL",
      state: "post",
      completed: true,
      awayScore: "99",
      homeScore: "70",
      awayRecord: "5-7",
      homeRecord: "4-8",
    });

    const pick = bestUnseenFinishedGame(
      [blowout, next, top],
      (ev) => ev.id === "valks-best",
    );

    expect(pick?.event.id).toBe("next-best");
    expect(pick?.isOverallBest).toBe(false);
  });

  it("marks the top finished game as overall best when it is not already shown", () => {
    const top = event({
      id: "top",
      date: "2026-06-06T19:00:00Z",
      away: "GS",
      home: "NY",
      state: "post",
      completed: true,
      awayScore: "91",
      homeScore: "90",
      awayRecord: "9-2",
      homeRecord: "8-3",
    });
    const second = event({
      id: "second",
      date: "2026-06-06T20:00:00Z",
      away: "LV",
      home: "MIN",
      state: "post",
      completed: true,
      awayScore: "84",
      homeScore: "79",
      awayRecord: "8-4",
      homeRecord: "7-5",
    });

    const pick = bestUnseenFinishedGame([second, top]);

    expect(pick?.event.id).toBe("top");
    expect(pick?.isOverallBest).toBe(true);
  });
});

describe("postponements", () => {
  // ESPN shape for a postponed game: parked in the "post" state with
  // completed:false and 0–0 scores. Without special handling it reads as a
  // finished 0–0 "Final" tile.
  const postponed = event({
    id: "sf-atl-ppd",
    date: "2026-06-18T23:15:00Z",
    away: "SF",
    home: "ATL",
    state: "post",
    completed: false,
    name: "STATUS_POSTPONED",
    awayScore: "0",
    homeScore: "0",
  });

  it("recognizes a postponed game and never treats it as final", () => {
    expect(isPostponedLike(postponed)).toBe(true);
    expect(isFinalEvent(postponed)).toBe(false);
  });

  it("still treats a genuinely completed game as final", () => {
    const real = event({
      id: "sf-final",
      date: "2026-06-17T23:15:00Z",
      away: "SF",
      home: "ATL",
      state: "post",
      completed: true,
      name: "STATUS_FINAL",
      awayScore: "5",
      homeScore: "3",
    });
    expect(isPostponedLike(real)).toBe(false);
    expect(isFinalEvent(real)).toBe(true);
  });

  it("falls back to status-name drift via post-state + not-completed", () => {
    const driftedName = event({
      id: "drift",
      date: "2026-06-18T23:15:00Z",
      away: "SF",
      home: "ATL",
      state: "post",
      completed: false,
      name: "STATUS_RAINOUT_NEW_NAME",
    });
    expect(isPostponedLike(driftedName)).toBe(true);
    expect(isFinalEvent(driftedName)).toBe(false);
  });

  it("never picks a postponed game as a best finished game to watch", () => {
    const real = event({
      id: "real",
      date: "2026-06-18T20:00:00Z",
      away: "GS",
      home: "NY",
      state: "post",
      completed: true,
      awayScore: "84",
      homeScore: "82",
    });
    const pick = bestUnseenFinishedGame([postponed, real]);
    expect(pick?.event.id).toBe("real");
  });

  it("does not let a postponement suppress a team's real prior recap", () => {
    const lookup = buildTeamLookup(["mlb-giants"]);
    const priorFinal = event({
      id: "sf-prior-final",
      date: "2026-06-17T23:15:00Z",
      away: "SF",
      home: "ATL",
      state: "post",
      completed: true,
      name: "STATUS_FINAL",
      awayScore: "5",
      homeScore: "3",
    });

    const latest = latestMap(
      [
        { league: "baseball/mlb", event: priorFinal },
        { league: "baseball/mlb", event: postponed },
      ],
      lookup,
    );

    // The postponed game never "started", so the prior final stays the latest
    // started event for the Giants and remains visible.
    expect(
      isLatestStartedEventForTrackedTeams(
        priorFinal,
        "baseball/mlb",
        lookup,
        latest,
      ),
    ).toBe(true);
    expect(
      isLatestStartedEventForTrackedTeams(
        postponed,
        "baseball/mlb",
        lookup,
        latest,
      ),
    ).toBe(false);
  });
});

describe("sports watch links", () => {
  it("deep-links WNBA replays to the game page", () => {
    const wnbaGameIds = new Map([["20260602/LVALAS", "1022600069"]]);

    expect(
      watchRecordingUrl({
        league: "basketball/wnba",
        awayAbbr: "LV",
        homeAbbr: "LA",
        isoDate: "2026-06-02",
        wnbaGameIds,
      }),
    ).toEqual({
      href: "https://www.wnba.com/game/lva-vs-las-1022600069",
      label: "WNBA League Pass",
    });
  });

  it("maps Stephen's tracked WNBA team to WNBA triCodes", () => {
    const wnbaGameIds = new Map([["20260604/GSVMIN", "1022600073"]]);

    expect(
      watchRecordingUrl({
        league: "basketball/wnba",
        awayAbbr: "GS",
        homeAbbr: "MIN",
        isoDate: "2026-06-04",
        matchedKey: "wnba-valkyries",
        wnbaGameIds,
      }),
    ).toEqual({
      href: "https://www.wnba.com/game/gsv-vs-min-1022600073",
      label: "WNBA League Pass",
    });
  });

  it("maps Portland WNBA replays to the Fire game page", () => {
    const wnbaGameIds = new Map([["20260605/PHXPDX", "1022600076"]]);

    expect(
      watchRecordingUrl({
        league: "basketball/wnba",
        awayAbbr: "PHX",
        homeAbbr: "POR",
        isoDate: "2026-06-05",
        wnbaGameIds,
      }),
    ).toEqual({
      href: "https://www.wnba.com/game/phx-vs-pdx-1022600076",
      label: "WNBA League Pass",
    });
  });
});
