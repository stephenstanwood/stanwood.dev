import { describe, expect, it } from "vitest";
import { DEFAULT_TEAM_KEYS, resolvePrefs } from "./WTWTW";

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
