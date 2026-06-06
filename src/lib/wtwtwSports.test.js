import { describe, expect, it } from "vitest";
import {
  ALWAYS_SHOW_TEAMS,
  buildTeamLookup,
  isLatestStartedEventForTrackedTeams,
  latestStartedAtByTrackedTeam,
  watchRecordingUrl,
} from "./wtwtwSports";
import { getTeam } from "./teamRegistry";

function event({ id, date, away, home, state, completed = false, playoff = false }) {
  return {
    id,
    date,
    season: playoff ? { type: 3, slug: "post-season" } : undefined,
    competitions: [
      {
        status: {
          type: {
            state,
            completed,
            name: state === "in" ? "STATUS_IN_PROGRESS" : undefined,
          },
        },
        competitors: [
          { homeAway: "away", team: { abbreviation: away }, score: "80" },
          { homeAway: "home", team: { abbreviation: home }, score: "75" },
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
