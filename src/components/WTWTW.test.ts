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
  afterEach(() => vi.unstubAllGlobals());

  it("accepts verified empty days", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ events: [] }))));
    const result = await loadWeekSchedules(["basketball/nba", "baseball/mlb"], ["20261108", "20261109"]);
    expect([...result.entries()]).toEqual([["20261108", []], ["20261109", []]]);
  });

  it("rejects a failed league instead of publishing an empty week", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url.includes("baseball/mlb") ? new Response("Unavailable", { status: 502 })
        : new Response(JSON.stringify({ events: [] }))));
    await expect(loadWeekSchedules(["basketball/nba", "baseball/mlb"], ["20261108"]))
      .rejects.toThrow("unavailable");
  });

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
