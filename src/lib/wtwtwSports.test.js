import { describe, expect, it } from "vitest";
import {
  buildTeamLookup,
  isLatestStartedEventForTrackedTeams,
  latestStartedAtByTrackedTeam,
} from "./wtwtwSports";

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
