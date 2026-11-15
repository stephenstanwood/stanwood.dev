import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TEAM_KEYS, loadWeekSchedules, resolvePrefs } from "./WTWTW";

const PACIFIC = "America/Los_Angeles";

describe("WTWTW preferences", () => {
  it("restores Stephen's teams for the legacy empty state", () => {
    expect(
      resolvePrefs({ teams: [], timezone: PACIFIC }, false, "America/New_York"),
    ).toEqual({ teams: DEFAULT_TEAM_KEYS, timezone: PACIFIC });
  });

  it("preserves a nonempty custom team list", () => {
    expect(
      resolvePrefs(
        { teams: ["mlb-athletics"], timezone: PACIFIC },
        false,
        "America/New_York",
      ),
    ).toEqual({ teams: ["mlb-athletics"], timezone: PACIFIC });
  });

  it("allows an intentionally empty list after the restoration", () => {
    expect(
      resolvePrefs({ teams: [], timezone: PACIFIC }, true, "America/New_York"),
    ).toEqual({ teams: [], timezone: PACIFIC });
  });

  it("drops invalid stored team keys", () => {
    expect(
      resolvePrefs(
        { teams: ["nba-warriors", "not-a-team", 42], timezone: PACIFIC },
        true,
        "America/New_York",
      ),
    ).toEqual({ teams: ["nba-warriors"], timezone: PACIFIC });
  });
});


describe("WTWTW complete schedule loading", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("accepts verified empty days", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ events: [] }))));
    const result = await loadWeekSchedules(["basketball/nba", "baseball/mlb"], ["20261108", "20261109"]);
    expect([...result.entries()]).toEqual([["20261108", []], ["20261109", []]]);
  });

  it("retries only the temporary failure and includes its games in the week", async () => {
    vi.useFakeTimers();
    const nbaUrl = "/api/espn/basketball/nba/scoreboard?dates=20261108";
    const mlbUrl = "/api/espn/baseball/mlb/scoreboard?dates=20261108";
    const event = { id: "nba-game" };
    let nbaAttempts = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === nbaUrl && ++nbaAttempts === 1) {
        return new Response("Unavailable", { status: 502, headers: { "Retry-After": "1" } });
      }
      return Response.json({ events: url === nbaUrl ? [event] : [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    const week = loadWeekSchedules(["basketball/nba", "baseball/mlb"], ["20261108"]);
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([nbaUrl, mlbUrl]);
    await vi.advanceTimersByTimeAsync(1);
    expect((await week).get("20261108")).toEqual([{ leaguePath: "basketball/nba", event }]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([nbaUrl, mlbUrl, nbaUrl]);
  });

  it("stops after the retry instead of publishing a failed league as empty", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () =>
      new Response("Unavailable", { status: 502, headers: { "Retry-After": "1" } }));
    vi.stubGlobal("fetch", fetchMock);
    const failed = expect(loadWeekSchedules(["basketball/nba"], ["20261108"])).rejects.toThrow("unavailable");
    await vi.advanceTimersByTimeAsync(1000);
    await failed;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each<[number, string]>([[403, "1"], [429, "1"], [502, ""], [502, "30"]])(
    "does not retry HTTP %s with an ineligible Retry-After (%s)", async (status, wait) => {
      const fetchMock = vi.fn(async () => new Response("Unavailable", {
        status, headers: wait ? { "Retry-After": wait } : undefined,
      }));
      vi.stubGlobal("fetch", fetchMock);
      await expect(loadWeekSchedules(["basketball/nba"], ["20261108"])).rejects.toThrow("unavailable");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects a later failed date even when earlier days loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url.includes("20261109") ? Promise.reject(new TypeError("Failed to fetch"))
        : new Response(JSON.stringify({ events: [{ date: "2026-11-08T20:00Z" }] }))));
    await expect(loadWeekSchedules(["basketball/nba"], ["20261108", "20261109"]))
      .rejects.toThrow("Failed to fetch");
  });

  it("rejects malformed JSON scoreboards instead of treating them as no games", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "Unavailable" }))));
    await expect(loadWeekSchedules(["basketball/nba"], ["20261108"])).rejects.toThrow("unavailable");
  });

  it("uses the site's own scoreboard endpoint", async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify({ events: [] })));
    vi.stubGlobal("fetch", fetchMock);
    await loadWeekSchedules(["basketball/nba"], ["20261108"]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/espn/basketball/nba/scoreboard?dates=20261108");
  });
});
